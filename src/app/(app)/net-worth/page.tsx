import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listAccountsWithBalances } from "@/lib/data/accounts";
import { calculateNetWorth } from "@/lib/finance/calculations";
import { listAllTransactionsRaw } from "@/lib/data/transactions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from "@/lib/account-types";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/empty-state";

export default async function NetWorthPage() {
  const user = await requireUser();
  const [accounts, transactions] = await Promise.all([
    listAccountsWithBalances(user.id),
    listAllTransactionsRaw(user.id),
  ]);

  const netWorth = calculateNetWorth(accounts, transactions);
  const assets = accounts.filter((a) => a.type !== "credit_card");
  const liabilities = accounts.filter((a) => a.type === "credit_card");

  return (
    <div className="space-y-6">
      <PageHeader title="Net Worth" description="What you own minus what you owe." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total assets" value={formatMoney(netWorth.totalAssetsMinor)} icon={TrendingUp} tone="positive" />
        <StatCard
          label="Total liabilities"
          value={formatMoney(Math.max(netWorth.totalLiabilitiesMinor, 0))}
          icon={TrendingDown}
          tone={netWorth.totalLiabilitiesMinor > 0 ? "negative" : "default"}
        />
        <StatCard label="Net worth" value={formatMoney(netWorth.netWorthMinor)} icon={Wallet} />
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add accounts to see your net worth."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountBreakdown accounts={assets} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              {liabilities.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No credit card accounts.</p>
              ) : (
                <AccountBreakdown accounts={liabilities} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AccountBreakdown({
  accounts,
}: {
  accounts: Awaited<ReturnType<typeof listAccountsWithBalances>>;
}) {
  return (
    <ul className="divide-y">
      {accounts.map((account) => {
        const Icon = ACCOUNT_TYPE_ICONS[account.type];
        return (
          <li key={account.id} className="flex items-center gap-3 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[account.type]}</p>
            </div>
            <p className="text-sm font-medium tabular-nums">{formatMoney(account.balanceMinor)}</p>
          </li>
        );
      })}
    </ul>
  );
}
