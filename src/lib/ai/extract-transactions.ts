import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Gemini's inline-data request limit is ~20MB, and base64 inflates raw bytes
// by ~4/3. Cap the combined *raw* size well under that so the encoded
// payload plus prompt/JSON overhead stays safely inside the limit. Kept
// above MAX_FILE_BYTES so a single max-size file never fails only this check.
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export interface AttachmentInput {
  mimeType: string;
  base64: string;
}

const extractedTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  merchant: z.string().trim().min(1).max(200),
  amount: z.number().positive().max(100_000_000),
  direction: z.enum(["income", "expense"]),
});

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;

const extractedTransactionsSchema = z.array(extractedTransactionSchema).max(500);

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      date: {
        type: "STRING",
        description: "Transaction date normalized to YYYY-MM-DD. Infer the year from context (assume the current year if not shown).",
      },
      merchant: {
        type: "STRING",
        description: "The merchant, payee, or counterparty name as shown in the statement line.",
      },
      amount: {
        type: "NUMBER",
        description: "The transaction amount as a positive number in the statement's major currency unit (e.g. 18.50, not 1850).",
      },
      direction: {
        type: "STRING",
        enum: ["income", "expense"],
        description: "\"income\" if money was received/credited into the account, \"expense\" if money was paid/debited out.",
      },
    },
    required: ["date", "merchant", "amount", "direction"],
    propertyOrdering: ["date", "merchant", "amount", "direction"],
  },
} as const;

const PROMPT = `You are reading transaction history from one or more attachments, which may be screenshots of a bank/e-wallet app, and/or PDF bank or e-wallet statements (which may span multiple pages and may have a tabular layout with columns such as Date, Description, Debit, Credit, Balance).

Extract every individual transaction line you can see across all attachments into a JSON array. For each transaction:
- date: normalize to YYYY-MM-DD. In a screenshot, if only day/month is shown under a "Today"/"Yesterday"/date-header grouping, use that header's date. In a statement table, use that row's transaction/posting date. If no year is shown anywhere, assume the current year.
- merchant: the payee/counterparty/description text shown for that line (e.g. "Starbucks", "GRAB *RIDE", "John Tan", or a statement's raw description text). Keep it short and as-shown; do not invent a name if illegible.
- amount: a positive number, in the major currency unit shown (e.g. 18.50 for RM18.50). Never include a currency symbol or thousands separator. If a statement has separate Debit and Credit columns, use whichever one is non-empty for that row.
- direction: "income" if the amount was received/credited (a screenshot's green/"+"/"received"/"credit"/"refund"/"deposit" cue, or a statement's Credit column); "expense" if paid/debited (a screenshot's red/black/"-"/"paid"/"debit"/"sent"/"purchase" cue, or a statement's Debit column).

Rules:
- Only extract lines that are clearly individual transactions with a date, a counterparty/description, and an amount. Skip balance summaries, running-balance columns, headers, footers, ads, or anything you can't read confidently.
- If the same transaction appears in more than one attachment (e.g. overlapping screenshot scroll position), only include it once.
- Do not perform currency conversion. Report the amount exactly as shown.
- Return an empty array if no transactions are found. Never fabricate a transaction that isn't visibly present.`;

export class TransactionExtractionError extends Error {}

function assertConfigured() {
  if (!process.env.GEMINI_API_KEY) {
    throw new TransactionExtractionError(
      "GEMINI_API_KEY is not set. Add it to your environment to use the importer.",
    );
  }
}

export function validateAttachmentInputs(files: File[]): void {
  if (files.length === 0) {
    throw new TransactionExtractionError("Choose at least one screenshot or PDF statement.");
  }
  if (files.length > MAX_FILES) {
    throw new TransactionExtractionError(`Upload at most ${MAX_FILES} files at a time.`);
  }
  let totalBytes = 0;
  for (const file of files) {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      throw new TransactionExtractionError(`${file.name} isn't a supported file type.`);
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new TransactionExtractionError(`${file.name} is larger than 10MB.`);
    }
    totalBytes += file.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new TransactionExtractionError(
      "Those files add up to too much data in one go — try fewer pages/screenshots at a time.",
    );
  }
}

export async function filesToAttachmentInputs(files: File[]): Promise<AttachmentInput[]> {
  return Promise.all(
    files.map(async (file) => ({
      mimeType: file.type,
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    })),
  );
}

export async function extractTransactionsFromAttachments(
  attachments: AttachmentInput[],
): Promise<ExtractedTransaction[]> {
  assertConfigured();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            ...attachments.map((attachment) => ({
              inlineData: { mimeType: attachment.mimeType, data: attachment.base64 },
            })),
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
  } catch (cause) {
    throw new TransactionExtractionError("Gemini request failed. Try again in a moment.", {
      cause,
    });
  }

  const text = response.text;
  if (!text) {
    throw new TransactionExtractionError("Gemini returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    throw new TransactionExtractionError("Gemini's response wasn't valid JSON.", { cause });
  }

  const result = extractedTransactionsSchema.safeParse(parsed);
  if (!result.success) {
    throw new TransactionExtractionError("Gemini's response didn't match the expected shape.");
  }

  return result.data;
}
