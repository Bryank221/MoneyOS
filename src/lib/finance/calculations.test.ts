import { describe, expect, it } from "vitest";
import {
  calculateAccountBalance,
  calculateBudgetUsage,
  calculateGoalProgress,
  calculateMonthlyExpenses,
  calculateMonthlyIncome,
  calculateNetWorth,
  calculateSpendingByCategory,
} from "./calculations";
import type { AccountLike, TransactionLike } from "./types";

const bank: AccountLike = { id: "acc-bank", type: "bank", initialBalanceMinor: 10_000 };
const card: AccountLike = { id: "acc-card", type: "credit_card", initialBalanceMinor: 0 };

describe("calculateAccountBalance", () => {
  it("adds income and subtracts expenses for the account", () => {
    const txs: TransactionLike[] = [
      { id: "1", accountId: bank.id, type: "income", amountMinor: 5_000, transactionDate: "2026-09-01" },
      { id: "2", accountId: bank.id, type: "expense", amountMinor: 1_500, transactionDate: "2026-09-02" },
    ];
    expect(calculateAccountBalance(bank, txs)).toBe(10_000 + 5_000 - 1_500);
  });

  it("moves money for transfers without double counting", () => {
    const txs: TransactionLike[] = [
      {
        id: "1",
        accountId: bank.id,
        transferAccountId: card.id,
        type: "transfer",
        amountMinor: 2_000,
        transactionDate: "2026-09-01",
      },
    ];
    expect(calculateAccountBalance(bank, txs)).toBe(10_000 - 2_000);
    expect(calculateAccountBalance(card, txs)).toBe(0 + 2_000);
  });

  it("ignores transactions for other accounts", () => {
    const other: AccountLike = { id: "acc-other", type: "cash", initialBalanceMinor: 500 };
    const txs: TransactionLike[] = [
      { id: "1", accountId: bank.id, type: "income", amountMinor: 5_000, transactionDate: "2026-09-01" },
    ];
    expect(calculateAccountBalance(other, txs)).toBe(500);
  });
});

describe("calculateNetWorth", () => {
  it("treats credit card balances as liabilities", () => {
    const txs: TransactionLike[] = [
      { id: "1", accountId: card.id, type: "expense", amountMinor: 3_000, transactionDate: "2026-09-01" },
    ];
    // Credit card "expense" increases what's owed (liability), decreases its raw balance calc.
    const result = calculateNetWorth([bank, card], txs);
    expect(result.totalAssetsMinor).toBe(10_000);
    expect(result.totalLiabilitiesMinor).toBe(-3_000);
    expect(result.netWorthMinor).toBe(10_000 - -3_000);
  });

  it("is zero for no accounts", () => {
    expect(calculateNetWorth([], [])).toEqual({
      totalAssetsMinor: 0,
      totalLiabilitiesMinor: 0,
      netWorthMinor: 0,
    });
  });
});

describe("calculateMonthlyIncome / calculateMonthlyExpenses", () => {
  const txs: TransactionLike[] = [
    { id: "1", accountId: bank.id, type: "income", amountMinor: 5_000, transactionDate: "2026-09-05" },
    { id: "2", accountId: bank.id, type: "income", amountMinor: 1_000, transactionDate: "2026-08-05" },
    { id: "3", accountId: bank.id, type: "expense", amountMinor: 2_000, transactionDate: "2026-09-10" },
    { id: "4", accountId: bank.id, type: "transfer", amountMinor: 500, transactionDate: "2026-09-10" },
  ];

  it("sums only income in the given month", () => {
    expect(calculateMonthlyIncome(txs, 2026, 8)).toBe(5_000);
  });

  it("sums only expenses in the given month, excluding transfers", () => {
    expect(calculateMonthlyExpenses(txs, 2026, 8)).toBe(2_000);
  });
});

describe("calculateBudgetUsage", () => {
  it("computes spend, remaining and percent used", () => {
    const txs: TransactionLike[] = [
      { id: "1", accountId: bank.id, categoryId: "cat-food", type: "expense", amountMinor: 30_000, transactionDate: "2026-09-05" },
      { id: "2", accountId: bank.id, categoryId: "cat-food", type: "expense", amountMinor: 25_000, transactionDate: "2026-09-15" },
    ];
    const usage = calculateBudgetUsage(
      { categoryId: "cat-food", month: "2026-09-01", amountMinor: 50_000 },
      txs,
    );
    expect(usage.spentMinor).toBe(55_000);
    expect(usage.remainingMinor).toBe(-5_000);
    expect(usage.percentUsed).toBeCloseTo(110);
    expect(usage.isExceeded).toBe(true);
  });

  it("ignores other categories and months", () => {
    const txs: TransactionLike[] = [
      { id: "1", accountId: bank.id, categoryId: "cat-transport", type: "expense", amountMinor: 30_000, transactionDate: "2026-09-05" },
      { id: "2", accountId: bank.id, categoryId: "cat-food", type: "expense", amountMinor: 10_000, transactionDate: "2026-08-05" },
    ];
    const usage = calculateBudgetUsage(
      { categoryId: "cat-food", month: "2026-09-01", amountMinor: 50_000 },
      txs,
    );
    expect(usage.spentMinor).toBe(0);
    expect(usage.isExceeded).toBe(false);
  });
});

describe("calculateGoalProgress", () => {
  it("caps percent complete at 100 and marks complete", () => {
    const progress = calculateGoalProgress(
      { id: "goal-1", targetAmountMinor: 10_000 },
      [
        { goalId: "goal-1", amountMinor: 6_000 },
        { goalId: "goal-1", amountMinor: 6_000 },
        { goalId: "goal-2", amountMinor: 999_999 },
      ],
    );
    expect(progress.savedAmountMinor).toBe(12_000);
    expect(progress.percentComplete).toBe(100);
    expect(progress.remainingMinor).toBe(0);
    expect(progress.isComplete).toBe(true);
  });

  it("reports partial progress", () => {
    const progress = calculateGoalProgress(
      { id: "goal-1", targetAmountMinor: 10_000 },
      [{ goalId: "goal-1", amountMinor: 2_500 }],
    );
    expect(progress.percentComplete).toBe(25);
    expect(progress.remainingMinor).toBe(7_500);
    expect(progress.isComplete).toBe(false);
  });
});

describe("calculateSpendingByCategory", () => {
  it("groups and sorts expense totals descending", () => {
    const txs: TransactionLike[] = [
      { id: "1", accountId: bank.id, categoryId: "cat-food", type: "expense", amountMinor: 3_000, transactionDate: "2026-09-05" },
      { id: "2", accountId: bank.id, categoryId: "cat-transport", type: "expense", amountMinor: 8_000, transactionDate: "2026-09-06" },
      { id: "3", accountId: bank.id, categoryId: "cat-food", type: "expense", amountMinor: 2_000, transactionDate: "2026-09-07" },
      { id: "4", accountId: bank.id, categoryId: "cat-food", type: "income", amountMinor: 9_999, transactionDate: "2026-09-07" },
    ];
    const result = calculateSpendingByCategory(txs, 2026, 8);
    expect(result).toEqual([
      { categoryId: "cat-transport", totalMinor: 8_000 },
      { categoryId: "cat-food", totalMinor: 5_000 },
    ]);
  });
});
