import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listAccounts } from "@/lib/data/accounts";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ImportFlow } from "@/components/transactions/import/import-flow";

export default async function ImportTransactionsPage() {
  const user = await requireUser();
  const [accounts, categories] = await Promise.all([
    listAccounts(user.id),
    listCategories(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import with AI"
        description="Upload screenshots or a PDF bank/e-wallet statement and let AI fill in the details for you to review."
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Add an account first"
          description="You need at least one account to import transactions into."
          action={
            <Link href="/accounts" className={buttonVariants()}>
              Go to accounts
            </Link>
          }
        />
      ) : (
        <ImportFlow accounts={accounts} categories={categories} />
      )}
    </div>
  );
}
