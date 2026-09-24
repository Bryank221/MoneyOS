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
import { addContributionAction, type ActionState } from "@/lib/actions/goals";

const initialState: ActionState = {};
const today = () => new Date().toISOString().slice(0, 10);

export function ContributionDialog({ goalId, trigger }: { goalId: string; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addContributionAction,
    initialState,
  );

  useCloseOnSuccess(state.success, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add contribution</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="goalId" value={goalId} />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (RM)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contributionDate">Date</Label>
            <Input
              id="contributionDate"
              name="contributionDate"
              type="date"
              defaultValue={today()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional" />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add contribution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
