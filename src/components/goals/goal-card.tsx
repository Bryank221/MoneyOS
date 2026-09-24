"use client";

import { Pencil, Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { ContributionDialog } from "@/components/goals/contribution-dialog";
import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { deleteGoalAction } from "@/lib/actions/goals";
import { formatMoney } from "@/lib/money";
import type { GoalWithProgress } from "@/lib/data/goals";

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        {goal.targetDate ? (
          <p className="text-xs text-muted-foreground">
            Target date: {format(new Date(goal.targetDate), "d MMM yyyy")}
          </p>
        ) : (
          <span />
        )}
        <div className="flex gap-1">
          <GoalFormDialog
            key={`${goal.id}:${goal.updatedAt.toISOString()}`}
            goal={goal}
            trigger={
              <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="size-4" />
              </button>
            }
          />
          <DeleteButton
            action={() => deleteGoalAction(goal.id)}
            title={`Delete ${goal.name}?`}
            description="This also deletes its contribution history. This can't be undone."
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalProgressCard goal={goal} />

        <ContributionDialog
          goalId={goal.id}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              Add contribution
            </Button>
          }
        />

        {goal.contributions.length > 0 ? (
          <ul className="space-y-1.5 border-t pt-3 text-sm">
            {goal.contributions.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-muted-foreground">
                <span>{format(new Date(c.contributionDate), "d MMM yyyy")}</span>
                <span className="tabular-nums text-foreground">{formatMoney(c.amountMinor)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
