import {
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateNetWorth,
  calculateSpendingByCategory,
} from "@/lib/finance/calculations";
import { listAccounts } from "@/lib/data/accounts";
import { listAllTransactionsRaw, listTransactions } from "@/lib/data/transactions";
import { listCategories } from "@/lib/data/categories";
import { listBudgetsWithUsage, monthKey } from "@/lib/data/budgets";
import { listGoals } from "@/lib/data/goals";

export async function getDashboardData(userId: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const currentMonthKey = monthKey(now);

  const [accounts, allTransactions, categories, recentTransactions, budgets, goals] =
    await Promise.all([
      listAccounts(userId),
      listAllTransactionsRaw(userId),
      listCategories(userId),
      listTransactions(userId, { limit: 6 }),
      listBudgetsWithUsage(userId, currentMonthKey),
      listGoals(userId),
    ]);

  const netWorth = calculateNetWorth(
    accounts.map((a) => ({ id: a.id, type: a.type, initialBalanceMinor: a.initialBalanceMinor })),
    allTransactions.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      transferAccountId: t.transferAccountId,
      categoryId: t.categoryId,
      type: t.type,
      amountMinor: t.amountMinor,
      transactionDate: t.transactionDate,
    })),
  );

  const incomeMinor = calculateMonthlyIncome(allTransactions, year, month);
  const expensesMinor = calculateMonthlyExpenses(allTransactions, year, month);
  const savingsMinor = incomeMinor - expensesMinor;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const spendingByCategory = calculateSpendingByCategory(allTransactions, year, month).map(
    (row) => ({
      name: row.categoryId ? categoryMap.get(row.categoryId) ?? "Uncategorized" : "Uncategorized",
      totalMinor: row.totalMinor,
    }),
  );

  return {
    netWorth,
    incomeMinor,
    expensesMinor,
    savingsMinor,
    spendingByCategory,
    recentTransactions,
    budgets,
    goals,
    categories,
    accounts,
  };
}
