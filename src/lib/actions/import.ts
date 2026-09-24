"use server";

import { requireUser } from "@/lib/auth/session";
import {
  extractTransactionsFromAttachments,
  filesToAttachmentInputs,
  TransactionExtractionError,
  validateAttachmentInputs,
  type ExtractedTransaction,
} from "@/lib/ai/extract-transactions";

export interface ExtractTransactionsResult {
  transactions?: ExtractedTransaction[];
  error?: string;
}

export async function extractTransactionsAction(
  formData: FormData,
): Promise<ExtractTransactionsResult> {
  await requireUser();

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  try {
    validateAttachmentInputs(files);
    const attachments = await filesToAttachmentInputs(files);
    const transactions = await extractTransactionsFromAttachments(attachments);
    return { transactions };
  } catch (error) {
    if (error instanceof TransactionExtractionError) {
      return { error: error.message };
    }
    return { error: "Something went wrong reading those files. Try again." };
  }
}
