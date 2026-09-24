"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { majorToMinor } from "@/lib/money";
import * as transactionsData from "@/lib/data/transactions";
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

export async function createTransactionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const result = parseTransactionForm(formData);
  if ("error" in result) return { error: result.error };
  const { data } = result;

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
