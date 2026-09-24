"use client";

import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { DeleteAccountButton } from "@/components/accounts/delete-account-button";
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from "@/lib/account-types";
import { formatMoney } from "@/lib/money";
import type { AccountWithBalance } from "@/lib/data/accounts";
import { cn } from "@/lib/utils";

export function AccountCard({ account }: { account: AccountWithBalance }) {
  const Icon = ACCOUNT_TYPE_ICONS[account.type];
  const isLiability = account.type === "credit_card";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="font-medium leading-none">{account.name}</p>
            <Badge variant="secondary" className="mt-1.5">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </Badge>
          </div>
        </div>
        <AccountFormDialog
          key={`${account.id}:${account.updatedAt.toISOString()}`}
          account={account}
          trigger={
            <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <Pencil className="size-4" />
            </button>
          }
        />
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            isLiability && account.balanceMinor > 0 && "text-destructive",
          )}
        >
          {formatMoney(account.balanceMinor, account.currency)}
        </p>
        <DeleteAccountButton accountId={account.id} accountName={account.name} />
      </CardContent>
    </Card>
  );
}
