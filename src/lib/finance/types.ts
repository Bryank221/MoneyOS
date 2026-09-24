export type AccountType = "bank" | "cash" | "e_wallet" | "credit_card" | "other";
export type TransactionType = "income" | "expense" | "transfer";

export interface AccountLike {
  id: string;
  type: AccountType;
  initialBalanceMinor: number;
}

export interface TransactionLike {
  id: string;
  accountId: string;
  transferAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amountMinor: number;
  transactionDate: string; // ISO date, e.g. "2026-09-24"
}

export interface BudgetLike {
  categoryId: string;
  month: string; // first day of month, ISO date
  amountMinor: number;
}

export interface GoalLike {
  id: string;
  targetAmountMinor: number;
}

export interface GoalContributionLike {
  goalId: string;
  amountMinor: number;
}

export const LIABILITY_ACCOUNT_TYPES: readonly AccountType[] = ["credit_card"];

export function isLiabilityAccount(type: AccountType): boolean {
  return LIABILITY_ACCOUNT_TYPES.includes(type);
}
