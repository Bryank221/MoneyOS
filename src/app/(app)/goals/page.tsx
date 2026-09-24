import { Plus, Target } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listGoals } from "@/lib/data/goals";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { GoalCard } from "@/components/goals/goal-card";

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await listGoals(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings goals"
        description="Set targets and watch your progress."
        action={
          <GoalFormDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New goal
              </Button>
            }
          />
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a savings goal like an emergency fund, a trip, or a big purchase."
          action={<GoalFormDialog trigger={<Button>Create your first goal</Button>} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
