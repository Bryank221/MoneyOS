import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/data/transactions";

const TYPE_ICON = { income: ArrowDownLeft, expense: ArrowUpRight, transfer: ArrowLeftRight };

export function RecentTransactions({
  transactions,
}: {
  transactions: TransactionWithRelations[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No transactions yet.{" "}
        <Link href="/transactions" className="underline underline-offset-4">
          Add one
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {transactions.map((tx) => {
        const Icon = TYPE_ICON[tx.type];
        const signedMinor = tx.type === "expense" ? -tx.amountMinor : tx.amountMinor;
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                tx.type === "income" && "bg-emerald-500/10 text-emerald-600",
                tx.type === "expense" && "bg-red-500/10 text-red-600",
                tx.type === "transfer" && "bg-blue-500/10 text-blue-600",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {tx.merchant || tx.description || tx.category?.name || "Transaction"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.transactionDate), "d MMM")} · {tx.account?.name}
              </p>
            </div>
            <p
              className={cn(
                "shrink-0 text-sm font-medium tabular-nums",
                tx.type === "income" && "text-emerald-600",
                tx.type === "expense" && "text-red-600",
              )}
            >
              {tx.type === "transfer"
                ? formatSignedMoney(-tx.amountMinor, tx.currency).replace("-", "")
                : formatSignedMoney(signedMinor, tx.currency)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
