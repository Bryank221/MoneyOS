"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil } from "lucide-react";
import { format } from "date-fns";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { deleteTransactionAction } from "@/lib/actions/transactions";
import { formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/data/accounts";
import type { Category } from "@/lib/data/categories";
import type { TransactionWithRelations } from "@/lib/data/transactions";

const TYPE_ICON = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
};

export function TransactionRow({
  transaction,
  accounts,
  categories,
}: {
  transaction: TransactionWithRelations;
  accounts: Account[];
  categories: Category[];
}) {
  const Icon = TYPE_ICON[transaction.type];
  const signedMinor =
    transaction.type === "expense" ? -transaction.amountMinor : transaction.amountMinor;

  return (
    <TableRow>
      <TableCell className="w-9">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            transaction.type === "income" && "bg-emerald-500/10 text-emerald-600",
            transaction.type === "expense" && "bg-red-500/10 text-red-600",
            transaction.type === "transfer" && "bg-blue-500/10 text-blue-600",
          )}
        >
          <Icon className="size-4" />
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {transaction.merchant || transaction.description || "—"}
        </div>
        <div className="text-xs text-muted-foreground">
          {transaction.account?.name}
          {transaction.type === "transfer" && transaction.transferAccount
            ? ` → ${transaction.transferAccount.name}`
            : ""}
        </div>
      </TableCell>
      <TableCell>
        {transaction.category ? (
          <Badge variant="secondary">{transaction.category.name}</Badge>
        ) : transaction.type === "transfer" ? (
          <Badge variant="outline">Transfer</Badge>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(transaction.transactionDate), "d MMM yyyy")}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          transaction.type === "income" && "text-emerald-600",
          transaction.type === "expense" && "text-red-600",
        )}
      >
        {transaction.type === "transfer"
          ? formatSignedMoney(-transaction.amountMinor, transaction.currency).replace("-", "")
          : formatSignedMoney(signedMinor, transaction.currency)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <TransactionFormDialog
            accounts={accounts}
            categories={categories}
            transaction={transaction}
            trigger={
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            }
          />
          <DeleteButton
            action={() => deleteTransactionAction(transaction.id)}
            title="Delete transaction?"
            description="This action can't be undone."
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
