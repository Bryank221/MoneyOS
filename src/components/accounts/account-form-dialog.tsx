"use client";

import { useActionState, useState } from "react";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/account-types";
import { createAccountAction, updateAccountAction, type ActionState } from "@/lib/actions/accounts";
import type { Account } from "@/lib/data/accounts";
import { minorToMajor } from "@/lib/money";

interface AccountFormDialogProps {
  account?: Account;
  trigger: React.ReactElement;
}

const initialState: ActionState = {};

export function AccountFormDialog({ account, trigger }: AccountFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!account;
  const action = isEdit
    ? updateAccountAction.bind(null, account.id)
    : createAccountAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );
  const [type, setType] = useState<Account["type"]>(account?.type ?? "bank");

  useCloseOnSuccess(state.success, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit account" : "New account"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={account?.name}
              placeholder="Maybank Savings"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <input type="hidden" name="type" value={type} />
            <Select
              items={ACCOUNT_TYPE_LABELS}
              value={type}
              onValueChange={(v) => setType(v as Account["type"])}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance">
              {isEdit ? "Initial balance (RM)" : "Starting balance (RM)"}
            </Label>
            <Input
              id="initialBalance"
              name="initialBalance"
              type="number"
              step="0.01"
              defaultValue={account ? minorToMajor(account.initialBalanceMinor) : 0}
              required
            />
          </div>

          <input type="hidden" name="currency" value="MYR" />

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
