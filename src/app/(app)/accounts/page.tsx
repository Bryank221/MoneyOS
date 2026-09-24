import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listAccountsWithBalances } from "@/lib/data/accounts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AccountCard } from "@/components/accounts/account-card";
import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccountsWithBalances(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Every place your money lives."
        action={
          <AccountFormDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New account
              </Button>
            }
          />
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add a bank account, e-wallet or cash pouch to start tracking your balances."
          action={
            <AccountFormDialog
              trigger={<Button>Add your first account</Button>}
            />
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
