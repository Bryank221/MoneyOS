"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { majorToMinor } from "@/lib/money";
import * as transactionsData from "@/lib/data/transactions";
import { accountIdsBelongToUser } from "@/lib/data/accounts";
import { categoryIdsAccessibleToUser } from "@/lib/data/categories";
import type { ActionState } from "@/lib/actions/types";
export type { ActionState } from "@/lib/actions/types";

const baseSchema = z.object({
  accountId: z.string().uuid("Choose an account."),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  currency: z.string().trim().length(3).default("MYR"),
  transactionDate: z.string().min(1, "Choose a date."),
  merchant: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  transferAccountId: z.string().uuid().optional().or(z.literal("")),
});

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/net-worth");
}

function parseTransactionForm(formData: FormData) {
  const parsed = baseSchema.safeParse({
    accountId: formData.get("accountId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "MYR",
    transactionDate: formData.get("transactionDate"),
    merchant: formData.get("merchant") || undefined,
    description: formData.get("description") || undefined,
    notes: formData.get("notes") || undefined,
    categoryId: formData.get("categoryId") || "",
    transferAccountId: formData.get("transferAccountId") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." } as const;
  }

  const data = parsed.data;

  if (data.type === "transfer") {
    if (!data.transferAccountId) {
      return { error: "Choose a destination account." } as const;
    }
    if (data.transferAccountId === data.accountId) {
      return { error: "Transfer accounts must be different." } as const;
    }
  } else if (!data.categoryId) {
    return { error: "Choose a category." } as const;
  }

  return { data } as const;
}

/**
 * Confirms every account/category id in the request actually belongs to
 * (or, for categories, is visible to) this user before it touches the DB.
 * See accountIdsBelongToUser / categoryIdsAccessibleToUser for why this is
 * load-bearing rather than redundant with RLS.
 */
async function verifyOwnedRefs(
  userId: string,
  refs: { accountId: string; transferAccountId?: string | null; categoryId?: string | null },
): Promise<string | null> {
  const accountIds = [refs.accountId, refs.transferAccountId].filter(
    (id): id is string => !!id,
  );
  if (!(await accountIdsBelongToUser(userId, accountIds))) {
    return "That account doesn't exist.";
  }
  if (refs.categoryId && !(await categoryIdsAccessibleToUser(userId, [refs.categoryId]))) {
    return "That category doesn't exist.";
  }
  return null;
}

export async function createTransactionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const result = parseTransactionForm(formData);
  if ("error" in result) return { error: result.error };
  const { data } = result;

  const refsError = await verifyOwnedRefs(user.id, data);
  if (refsError) return { error: refsError };

  await transactionsData.createTransaction(user.id, {
    accountId: data.accountId,
    type: data.type,
    amountMinor: majorToMinor(data.amount),
    currency: data.currency,
    transactionDate: data.transactionDate,
    merchant: data.merchant,
    description: data.description,
    notes: data.notes,
    categoryId: data.categoryId || null,
    transferAccountId: data.transferAccountId || null,
  });

  revalidateAll();
  return { success: true };
}

export async function updateTransactionAction(
  transactionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const result = parseTransactionForm(formData);
  if ("error" in result) return { error: result.error };
  const { data } = result;

  const refsError = await verifyOwnedRefs(user.id, data);
  if (refsError) return { error: refsError };

  await transactionsData.updateTransaction(user.id, transactionId, {
    accountId: data.accountId,
    type: data.type,
    amountMinor: majorToMinor(data.amount),
    currency: data.currency,
    transactionDate: data.transactionDate,
    merchant: data.merchant,
    description: data.description,
    notes: data.notes,
    categoryId: data.categoryId || null,
    transferAccountId: data.transferAccountId || null,
  });

  revalidateAll();
  return { success: true };
}

export async function deleteTransactionAction(transactionId: string) {
  const user = await requireUser();
  await transactionsData.deleteTransaction(user.id, transactionId);
  revalidateAll();
}

const importedRowSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  currency: z.string().trim().length(3).default("MYR"),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export type ImportedTransactionRow = z.infer<typeof importedRowSchema>;

export interface BulkImportResult extends ActionState {
  count?: number;
}

/**
 * Inserts rows reviewed and confirmed by the user after AI extraction from
 * screenshot(s). Category is optional here (unlike the manual form) since
 * the point of this flow is speed — users can categorize later.
 */
export async function bulkCreateTransactionsAction(
  rows: ImportedTransactionRow[],
): Promise<BulkImportResult> {
  const user = await requireUser();

  if (rows.length === 0) {
    return { error: "Nothing to import." };
  }
  if (rows.length > 500) {
    return { error: "Too many rows in one batch." };
  }

  const parsed = z.array(importedRowSchema).safeParse(rows);
  if (!parsed.success) {
    return { error: "One or more rows are invalid." };
  }

  const accountIds = parsed.data.map((row) => row.accountId);
  if (!(await accountIdsBelongToUser(user.id, accountIds))) {
    return { error: "One of those accounts doesn't exist." };
  }
  const categoryIds = parsed.data
    .map((row) => row.categoryId)
    .filter((id): id is string => !!id);
  if (!(await categoryIdsAccessibleToUser(user.id, categoryIds))) {
    return { error: "One of those categories doesn't exist." };
  }

  const created = await transactionsData.bulkCreateTransactions(
    user.id,
    parsed.data.map((row) => ({
      accountId: row.accountId,
      type: row.type,
      amountMinor: majorToMinor(row.amount),
      currency: row.currency,
      transactionDate: row.transactionDate,
      merchant: row.merchant,
      categoryId: row.categoryId ?? null,
    })),
  );

  revalidateAll();
  return { success: true, count: created.length };
}
