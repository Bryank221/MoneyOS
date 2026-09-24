import type {
  AccountLike,
  BudgetLike,
  GoalContributionLike,
  GoalLike,
  TransactionLike,
} from "./types";
import { isLiabilityAccount } from "./types";

/**
 * Balance of a single account = initial balance + all money movements
 * that touch it. Income/expense affect the account they're posted to.
 * Transfers subtract from the source account and add to the destination.
 */
export function calculateAccountBalance(
  account: AccountLike,
  transactions: TransactionLike[],
): number {
  let balance = account.initialBalanceMinor;

  for (const tx of transactions) {
    if (tx.type === "income" && tx.accountId === account.id) {
      balance += tx.amountMinor;
    } else if (tx.type === "expense" && tx.accountId === account.id) {
      balance -= tx.amountMinor;
    } else if (tx.type === "transfer") {
      if (tx.accountId === account.id) {
        balance -= tx.amountMinor;
      }
      if (tx.transferAccountId === account.id) {
        balance += tx.amountMinor;
      }
    }
  }

  return balance;
}

export interface NetWorthResult {
  totalAssetsMinor: number;
  totalLiabilitiesMinor: number;
  netWorthMinor: number;
}

/**
 * Net worth = assets - liabilities. Credit card balances are debt, so the
 * positive balance an account accrues is treated as a liability, not an
 * asset, when summing.
 */
export function calculateNetWorth(
  accounts: AccountLike[],
  transactions: TransactionLike[],
): NetWorthResult {
  let totalAssetsMinor = 0;
  let totalLiabilitiesMinor = 0;

  for (const account of accounts) {
    const balance = calculateAccountBalance(account, transactions);
    if (isLiabilityAccount(account.type)) {
      totalLiabilitiesMinor += balance;
    } else {
      totalAssetsMinor += balance;
    }
  }

  return {
    totalAssetsMinor,
    totalLiabilitiesMinor,
    netWorthMinor: totalAssetsMinor - totalLiabilitiesMinor,
  };
}

function isInMonth(dateIso: string, year: number, month: number): boolean {
  const d = new Date(dateIso);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month;
}

export function calculateMonthlyIncome(
  transactions: TransactionLike[],
  year: number,
  month: number, // 0-indexed
): number {
  return transactions
    .filter((tx) => tx.type === "income" && isInMonth(tx.transactionDate, year, month))
    .reduce((sum, tx) => sum + tx.amountMinor, 0);
}

export function calculateMonthlyExpenses(
  transactions: TransactionLike[],
  year: number,
  month: number, // 0-indexed
): number {
  return transactions
    .filter((tx) => tx.type === "expense" && isInMonth(tx.transactionDate, year, month))
    .reduce((sum, tx) => sum + tx.amountMinor, 0);
}

export interface BudgetUsage {
  categoryId: string;
  budgetMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentUsed: number;
  isExceeded: boolean;
}

/**
 * Spend for a budget's category, in the budget's month, compared to the
 * budgeted amount. Only expense transactions count toward spend.
 */
export function calculateBudgetUsage(
  budget: BudgetLike,
  transactions: TransactionLike[],
): BudgetUsage {
  const budgetDate = new Date(budget.month);
  const year = budgetDate.getUTCFullYear();
  const month = budgetDate.getUTCMonth();

  const spentMinor = transactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.categoryId === budget.categoryId &&
        isInMonth(tx.transactionDate, year, month),
    )
    .reduce((sum, tx) => sum + tx.amountMinor, 0);

  const remainingMinor = budget.amountMinor - spentMinor;
  const percentUsed =
    budget.amountMinor > 0 ? (spentMinor / budget.amountMinor) * 100 : 0;

  return {
    categoryId: budget.categoryId,
    budgetMinor: budget.amountMinor,
    spentMinor,
    remainingMinor,
    percentUsed,
    isExceeded: spentMinor > budget.amountMinor,
  };
}

export interface GoalProgress {
  goalId: string;
  targetAmountMinor: number;
  savedAmountMinor: number;
  remainingMinor: number;
  percentComplete: number;
  isComplete: boolean;
}

export function calculateGoalProgress(
  goal: GoalLike,
  contributions: GoalContributionLike[],
): GoalProgress {
  const savedAmountMinor = contributions
    .filter((c) => c.goalId === goal.id)
    .reduce((sum, c) => sum + c.amountMinor, 0);

  const remainingMinor = Math.max(goal.targetAmountMinor - savedAmountMinor, 0);
  const percentComplete =
    goal.targetAmountMinor > 0
      ? Math.min((savedAmountMinor / goal.targetAmountMinor) * 100, 100)
      : 0;

  return {
    goalId: goal.id,
    targetAmountMinor: goal.targetAmountMinor,
    savedAmountMinor,
    remainingMinor,
    percentComplete,
    isComplete: savedAmountMinor >= goal.targetAmountMinor,
  };
}

export interface CategorySpending {
  categoryId: string | null;
  totalMinor: number;
}

export function calculateSpendingByCategory(
  transactions: TransactionLike[],
  year: number,
  month: number,
): CategorySpending[] {
  const totals = new Map<string | null, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (!isInMonth(tx.transactionDate, year, month)) continue;
    const key = tx.categoryId ?? null;
    totals.set(key, (totals.get(key) ?? 0) + tx.amountMinor);
  }

  return Array.from(totals.entries())
    .map(([categoryId, totalMinor]) => ({ categoryId, totalMinor }))
    .sort((a, b) => b.totalMinor - a.totalMinor);
}
