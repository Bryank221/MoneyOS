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
import { upsertBudgetAction, type ActionState } from "@/lib/actions/budgets";
import type { Category } from "@/lib/data/categories";
import type { Budget } from "@/lib/data/budgets";
import { minorToMajor } from "@/lib/money";

interface BudgetFormDialogProps {
  categories: Category[];
  month: string;
  budget?: Budget;
  trigger: React.ReactElement;
}

const initialState: ActionState = {};

export function BudgetFormDialog({ categories, month, budget, trigger }: BudgetFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    upsertBudgetAction,
    initialState,
  );
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? categories[0]?.id ?? "");

  useCloseOnSuccess(state.success, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "New budget"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="month" value={month} />

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <input type="hidden" name="categoryId" value={categoryId} />
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")} disabled={!!budget}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monthly budget (RM)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={budget ? minorToMajor(budget.amountMinor) : undefined}
              required
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : budget ? "Save changes" : "Create budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
