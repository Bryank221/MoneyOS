"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { majorToMinor } from "@/lib/money";
import * as budgetsData from "@/lib/data/budgets";
import type { ActionState } from "@/lib/actions/types";
export type { ActionState } from "@/lib/actions/types";

const budgetSchema = z.object({
  categoryId: z.string().uuid("Choose a category."),
  month: z.string().min(1),
  amount: z.coerce.number().positive("Budget must be greater than zero."),
});

export async function upsertBudgetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    month: formData.get("month"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await budgetsData.upsertBudget(user.id, {
    categoryId: parsed.data.categoryId,
    month: parsed.data.month,
    amountMinor: majorToMinor(parsed.data.amount),
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudgetAction(budgetId: string) {
  const user = await requireUser();
  await budgetsData.deleteBudget(user.id, budgetId);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
