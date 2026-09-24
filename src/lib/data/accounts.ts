import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import {
  calculateAccountBalance,
  calculateNetWorth,
} from "@/lib/finance/calculations";
import type { AccountLike, TransactionLike } from "@/lib/finance/types";

export type Account = typeof accounts.$inferSelect;

export async function listAccounts(userId: string): Promise<Account[]> {
  return db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
    orderBy: (a, { asc }) => [asc(a.createdAt)],
  });
}

export async function getAccount(
  userId: string,
  accountId: string,
): Promise<Account | undefined> {
  return db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });
}

function toTransactionLike(tx: typeof transactions.$inferSelect): TransactionLike {
  return {
    id: tx.id,
    accountId: tx.accountId,
    transferAccountId: tx.transferAccountId,
    categoryId: tx.categoryId,
    type: tx.type,
    amountMinor: tx.amountMinor,
    transactionDate: tx.transactionDate,
  };
}

function toAccountLike(acc: Account): AccountLike {
  return {
    id: acc.id,
    type: acc.type,
    initialBalanceMinor: acc.initialBalanceMinor,
  };
}

export interface AccountWithBalance extends Account {
  balanceMinor: number;
}

/** All of a user's accounts, each annotated with its current balance. */
export async function listAccountsWithBalances(
  userId: string,
): Promise<AccountWithBalance[]> {
  const [accs, txs] = await Promise.all([
    listAccounts(userId),
    db.query.transactions.findMany({ where: eq(transactions.userId, userId) }),
  ]);

  const txLikes = txs.map(toTransactionLike);

  return accs.map((acc) => ({
    ...acc,
    balanceMinor: calculateAccountBalance(toAccountLike(acc), txLikes),
  }));
}

export async function getNetWorth(userId: string) {
  const [accs, txs] = await Promise.all([
    listAccounts(userId),
    db.query.transactions.findMany({ where: eq(transactions.userId, userId) }),
  ]);

  return calculateNetWorth(accs.map(toAccountLike), txs.map(toTransactionLike));
}

export interface CreateAccountInput {
  name: string;
  type: Account["type"];
  currency: string;
  initialBalanceMinor: number;
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  const [account] = await db
    .insert(accounts)
    .values({ userId, ...input })
    .returning();
  return account;
}

export interface UpdateAccountInput {
  name?: string;
  type?: Account["type"];
  currency?: string;
  initialBalanceMinor?: number;
  isActive?: boolean;
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput,
) {
  const [account] = await db
    .update(accounts)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();
  return account;
}

export async function deleteAccount(userId: string, accountId: string) {
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}
