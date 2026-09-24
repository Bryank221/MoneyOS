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
import { createGoalAction, updateGoalAction, type ActionState } from "@/lib/actions/goals";
import type { Goal } from "@/lib/data/goals";
import { minorToMajor } from "@/lib/money";

interface GoalFormDialogProps {
  goal?: Goal;
  trigger: React.ReactElement;
}

const initialState: ActionState = {};

export function GoalFormDialog({ goal, trigger }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!goal;
  const action = isEdit ? updateGoalAction.bind(null, goal.id) : createGoalAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );

  useCloseOnSuccess(state.success, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "New savings goal"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={goal?.name} placeholder="Emergency Fund" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target amount (RM)</Label>
            <Input
              id="targetAmount"
              name="targetAmount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={goal ? minorToMajor(goal.targetAmountMinor) : undefined}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date (optional)</Label>
            <Input
              id="targetDate"
              name="targetDate"
              type="date"
              defaultValue={goal?.targetDate ?? ""}
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
