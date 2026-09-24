import { Plus, ArrowLeftRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listTransactions } from "@/lib/data/transactions";
import { listAccounts } from "@/lib/data/accounts";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionRow } from "@/components/transactions/transaction-row";

interface TransactionsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  const [accounts, categories] = await Promise.all([
    listAccounts(user.id),
    listCategories(user.id),
  ]);

  const transactions = await listTransactions(user.id, {
    search: params.q,
    accountId: params.accountId,
    categoryId: params.categoryId,
    type: params.type as "income" | "expense" | "transfer" | undefined,
    sortBy: params.sortBy as "date" | "amount" | undefined,
    sortDir: params.sortDir as "asc" | "desc" | undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Every income, expense and transfer in one place."
        action={
          accounts.length > 0 ? (
            <TransactionFormDialog
              accounts={accounts}
              categories={categories}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Add transaction
                </Button>
              }
            />
          ) : null
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Add an account first"
          description="You need at least one account before you can log a transaction."
          action={<Button render={<a href="/accounts">Go to accounts</a>} />}
        />
      ) : (
        <div className="space-y-4">
          <TransactionFilters accounts={accounts} categories={categories} />

          {transactions.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions found"
              description="Try adjusting your filters, or add your first transaction."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      accounts={accounts}
                      categories={categories}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
