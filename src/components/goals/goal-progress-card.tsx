import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { GoalWithProgress } from "@/lib/data/goals";

export function GoalProgressCard({ goal }: { goal: GoalWithProgress }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{goal.name}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatMoney(goal.progress.savedAmountMinor)} / {formatMoney(goal.progress.targetAmountMinor)}
        </span>
      </div>
      <Progress value={goal.progress.percentComplete} />
      <p className={cn("text-xs text-muted-foreground", goal.progress.isComplete && "text-emerald-600")}>
        {goal.progress.isComplete
          ? "Goal reached!"
          : `${goal.progress.percentComplete.toFixed(0)}% complete`}
      </p>
    </div>
  );
}
