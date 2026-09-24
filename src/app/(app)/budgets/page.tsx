import { Plus, PiggyBank } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listBudgetsWithUsage, monthKey } from "@/lib/data/budgets";
import { listCategories } from "@/lib/data/categories";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/budgets/month-switcher";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetCard } from "@/components/budgets/budget-card";

interface BudgetsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month ?? monthKey(new Date());

  const [budgets, categories] = await Promise.all([
    listBudgetsWithUsage(user.id, month),
    listCategories(user.id),
  ]);

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Set monthly limits per category and track how you're doing."
        action={
          availableCategories.length > 0 ? (
            <BudgetFormDialog
              categories={availableCategories}
              month={month}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  New budget
                </Button>
              }
            />
          ) : null
        }
      />

      <MonthSwitcher month={month} />

      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets for this month"
          description="Set a spending limit for a category to keep an eye on it."
          action={
            availableCategories.length > 0 ? (
              <BudgetFormDialog
                categories={availableCategories}
                month={month}
                trigger={<Button>Create a budget</Button>}
              />
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categoryName={categoryMap.get(budget.categoryId) ?? "Category"}
              categories={expenseCategories}
              month={month}
            />
          ))}
        </div>
      )}
    </div>
  );
}
