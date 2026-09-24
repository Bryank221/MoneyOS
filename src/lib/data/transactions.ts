import { and, asc, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";

export type Transaction = typeof transactions.$inferSelect;
export type TransactionWithRelations = Transaction & {
  account: { id: string; name: string } | null;
  transferAccount: { id: string; name: string } | null;
  category: { id: string; name: string; icon: string | null } | null;
};

export interface TransactionFilters {
  search?: string;
  accountId?: string;
  categoryId?: string;
  type?: Transaction["type"];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "amount";
  sortDir?: "asc" | "desc";
  limit?: number;
}

export async function listTransactions(
  userId: string,
  filters: TransactionFilters = {},
): Promise<TransactionWithRelations[]> {
  const conditions: SQL[] = [eq(transactions.userId, userId)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(transactions.merchant, term),
        ilike(transactions.description, term),
        ilike(transactions.notes, term),
      )!,
    );
  }
  if (filters.accountId) {
    conditions.push(eq(transactions.accountId, filters.accountId));
  }
  if (filters.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters.dateFrom) {
    conditions.push(gte(transactions.transactionDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(transactions.transactionDate, filters.dateTo));
  }

  const sortColumn =
    filters.sortBy === "amount" ? transactions.amountMinor : transactions.transactionDate;
  const order = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const rows = await db
    .select({
      transaction: transactions,
      account: { id: accounts.id, name: accounts.name },
      category: { id: categories.id, name: categories.name, icon: categories.icon },
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(order, desc(transactions.createdAt))
    .limit(filters.limit ?? 500);

  // Resolve transfer destination account names separately to avoid an extra join alias dance.
  const transferAccountIds = Array.from(
    new Set(rows.map((r) => r.transaction.transferAccountId).filter((id): id is string => !!id)),
  );
  const transferAccounts = transferAccountIds.length
    ? await db.query.accounts.findMany({
        where: (a, { inArray }) => inArray(a.id, transferAccountIds),
      })
    : [];
  const transferAccountMap = new Map(transferAccounts.map((a) => [a.id, a]));

  return rows.map((r) => ({
    ...r.transaction,
    account: r.account,
    category: r.category,
    transferAccount: r.transaction.transferAccountId
      ? transferAccountMap.get(r.transaction.transferAccountId) ?? null
      : null,
  }));
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId?: string | null;
  transferAccountId?: string | null;
  type: Transaction["type"];
  amountMinor: number;
  currency: string;
  merchant?: string;
  description?: string;
  transactionDate: string;
  notes?: string;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
) {
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      ...input,
      categoryId: input.type === "transfer" ? null : input.categoryId ?? null,
      transferAccountId: input.type === "transfer" ? input.transferAccountId : null,
    })
    .returning();
  return transaction;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput,
) {
  const [transaction] = await db
    .update(transactions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning();
  return transaction;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
}

export async function listAllTransactionsRaw(userId: string): Promise<Transaction[]> {
  return db.query.transactions.findMany({ where: eq(transactions.userId, userId) });
}

export async function bulkCreateTransactions(
  userId: string,
  inputs: CreateTransactionInput[],
): Promise<Transaction[]> {
  if (inputs.length === 0) return [];
  return db
    .insert(transactions)
    .values(
      inputs.map((input) => ({
        userId,
        ...input,
        categoryId: input.type === "transfer" ? null : input.categoryId ?? null,
        transferAccountId: input.type === "transfer" ? input.transferAccountId : null,
      })),
    )
    .returning();
}
