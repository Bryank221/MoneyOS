import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BudgetUsage } from "@/lib/finance/calculations";

export function BudgetProgressBar({
  categoryName,
  usage,
}: {
  categoryName: string;
  usage: BudgetUsage;
}) {
  const percent = Math.min(usage.percentUsed, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{categoryName}</span>
        <span className={cn("tabular-nums text-muted-foreground", usage.isExceeded && "text-red-600 font-medium")}>
          {formatMoney(usage.spentMinor)} / {formatMoney(usage.budgetMinor)}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn(usage.isExceeded && "[&>div]:bg-red-600")}
      />
      <p className={cn("text-xs text-muted-foreground", usage.isExceeded && "text-red-600")}>
        {usage.isExceeded
          ? `Over by ${formatMoney(Math.abs(usage.remainingMinor))}`
          : `${formatMoney(usage.remainingMinor)} remaining`}
      </p>
    </div>
  );
}
