import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingByCategoryChart } from "@/components/dashboard/spending-by-category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { GoalProgressCard } from "@/components/goals/goal-progress-card";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your money, at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Net worth"
          value={formatMoney(data.netWorth.netWorthMinor)}
          icon={Wallet}
        />
        <StatCard
          label="Income this month"
          value={formatMoney(data.incomeMinor)}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label="Expenses this month"
          value={formatMoney(data.expensesMinor)}
          icon={TrendingDown}
          tone="negative"
        />
        <StatCard
          label="Savings this month"
          value={formatMoney(data.savingsMinor)}
          icon={PiggyBank}
          tone={data.savingsMinor >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No spending recorded this month yet.
              </p>
            ) : (
              <SpendingByCategoryChart data={data.spendingByCategory} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={data.recentTransactions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets this month</CardTitle>
          </CardHeader>
          <CardContent>
            {data.budgets.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="No budgets set"
                description="Set a monthly budget per category to track your spending."
                action={
                  <Link href="/budgets" className="text-sm font-medium underline underline-offset-4">
                    Create a budget
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {data.budgets.slice(0, 4).map((budget) => (
                  <BudgetProgressBar
                    key={budget.id}
                    categoryName={categoryMap.get(budget.categoryId) ?? "Category"}
                    usage={budget.usage}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings goals</CardTitle>
          </CardHeader>
          <CardContent>
            {data.goals.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                title="No goals yet"
                description="Set a savings goal like an emergency fund or a trip."
                action={
                  <Link href="/goals" className="text-sm font-medium underline underline-offset-4">
                    Create a goal
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {data.goals.slice(0, 4).map((goal) => (
                  <GoalProgressCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
