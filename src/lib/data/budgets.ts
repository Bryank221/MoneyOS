import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { calculateBudgetUsage, type BudgetUsage } from "@/lib/finance/calculations";
import { listAllTransactionsRaw } from "@/lib/data/transactions";

export type Budget = typeof budgets.$inferSelect;

/** Yields "YYYY-MM-01" for the first day of the given month. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function listBudgetsForMonth(
  userId: string,
  month: string,
): Promise<Budget[]> {
  return db.query.budgets.findMany({
    where: and(eq(budgets.userId, userId), eq(budgets.month, month)),
  });
}

export interface BudgetWithUsage extends Budget {
  usage: BudgetUsage;
}

export async function listBudgetsWithUsage(
  userId: string,
  month: string,
): Promise<BudgetWithUsage[]> {
  const [budgetRows, txs] = await Promise.all([
    listBudgetsForMonth(userId, month),
    listAllTransactionsRaw(userId),
  ]);

  return budgetRows.map((budget) => ({
    ...budget,
    usage: calculateBudgetUsage(
      { categoryId: budget.categoryId, month: budget.month, amountMinor: budget.amountMinor },
      txs,
    ),
  }));
}

export interface UpsertBudgetInput {
  categoryId: string;
  month: string;
  amountMinor: number;
}

export async function upsertBudget(userId: string, input: UpsertBudgetInput) {
  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, userId),
      eq(budgets.categoryId, input.categoryId),
      eq(budgets.month, input.month),
    ),
  });

  if (existing) {
    const [budget] = await db
      .update(budgets)
      .set({ amountMinor: input.amountMinor, updatedAt: new Date() })
      .where(eq(budgets.id, existing.id))
      .returning();
    return budget;
  }

  const [budget] = await db
    .insert(budgets)
    .values({ userId, ...input })
    .returning();
  return budget;
}

export async function deleteBudget(userId: string, budgetId: string) {
  await db.delete(budgets).where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)));
}
