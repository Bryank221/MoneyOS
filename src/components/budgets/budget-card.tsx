"use client";

import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { deleteBudgetAction } from "@/lib/actions/budgets";
import type { Category } from "@/lib/data/categories";
import type { BudgetWithUsage } from "@/lib/data/budgets";

export function BudgetCard({
  budget,
  categoryName,
  categories,
  month,
}: {
  budget: BudgetWithUsage;
  categoryName: string;
  categories: Category[];
  month: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="flex-1">
          <BudgetProgressBar categoryName={categoryName} usage={budget.usage} />
        </div>
        <div className="flex shrink-0 gap-1">
          <BudgetFormDialog
            categories={categories}
            month={month}
            budget={budget}
            trigger={
              <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="size-4" />
              </button>
            }
          />
          <DeleteButton
            action={() => deleteBudgetAction(budget.id)}
            title="Delete budget?"
            description={`This removes the ${categoryName} budget for this month.`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
