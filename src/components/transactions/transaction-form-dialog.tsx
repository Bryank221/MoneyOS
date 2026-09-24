"use client";

import { useActionState, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTransactionAction,
  updateTransactionAction,
  type ActionState,
} from "@/lib/actions/transactions";
import type { Account } from "@/lib/data/accounts";
import type { Category } from "@/lib/data/categories";
import type { Transaction } from "@/lib/data/transactions";
import { minorToMajor } from "@/lib/money";

interface TransactionFormDialogProps {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  trigger: React.ReactElement;
  defaultType?: Transaction["type"];
}

const initialState: ActionState = {};
const today = () => new Date().toISOString().slice(0, 10);

export function TransactionFormDialog({
  accounts,
  categories,
  transaction,
  trigger,
  defaultType = "expense",
}: TransactionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!transaction;
  const action = isEdit
    ? updateTransactionAction.bind(null, transaction.id)
    : createTransactionAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );

  const [type, setType] = useState<Transaction["type"]>(transaction?.type ?? defaultType);
  const [accountId, setAccountId] = useState(transaction?.accountId ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [transferAccountId, setTransferAccountId] = useState(
    transaction?.transferAccountId ?? "",
  );

  useCloseOnSuccess(state.success, setOpen);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === (type === "income" ? "income" : "expense")),
    [categories, type],
  );

  const transferTargets = accounts.filter((a) => a.id !== accountId);

  const accountItems = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );
  const transferAccountItems = useMemo(
    () => Object.fromEntries(transferTargets.map((a) => [a.id, a.name])),
    [transferTargets],
  );
  const categoryItems = useMemo(
    () => Object.fromEntries(filteredCategories.map((c) => [c.id, c.name])),
    [filteredCategories],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "New transaction"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          <Tabs value={type} onValueChange={(v) => setType(v as Transaction["type"])}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
              <TabsTrigger value="transfer" className="flex-1">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RM)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={transaction ? minorToMajor(transaction.amountMinor) : undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Date</Label>
              <Input
                id="transactionDate"
                name="transactionDate"
                type="date"
                defaultValue={transaction?.transactionDate ?? today()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">{type === "transfer" ? "From account" : "Account"}</Label>
            <input type="hidden" name="accountId" value={accountId} />
            <Select items={accountItems} value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
              <SelectTrigger id="accountId" className="w-full">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "transfer" ? (
            <div className="space-y-2">
              <Label htmlFor="transferAccountId">To account</Label>
              <input type="hidden" name="transferAccountId" value={transferAccountId} />
              <Select
                items={transferAccountItems}
                value={transferAccountId}
                onValueChange={(v) => setTransferAccountId(v ?? "")}
              >
                <SelectTrigger id="transferAccountId" className="w-full">
                  <SelectValue placeholder="Choose a destination" />
                </SelectTrigger>
                <SelectContent>
                  {transferTargets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <input type="hidden" name="categoryId" value={categoryId} />
              <Select items={categoryItems} value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              name="merchant"
              defaultValue={transaction?.merchant ?? ""}
              placeholder="e.g. Tesco, Grab, Starbucks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={transaction?.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={transaction?.notes ?? ""} rows={2} />
          </div>

          <input type="hidden" name="currency" value="MYR" />

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
