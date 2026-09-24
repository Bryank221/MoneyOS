import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goalContributions, goals } from "@/db/schema";
import { calculateGoalProgress, type GoalProgress } from "@/lib/finance/calculations";

export type Goal = typeof goals.$inferSelect;
export type GoalContribution = typeof goalContributions.$inferSelect;

export interface GoalWithProgress extends Goal {
  progress: GoalProgress;
  contributions: GoalContribution[];
}

export async function listGoals(userId: string): Promise<GoalWithProgress[]> {
  const [goalRows, contributionRows] = await Promise.all([
    db.query.goals.findMany({
      where: eq(goals.userId, userId),
      orderBy: (g, { asc }) => [asc(g.createdAt)],
    }),
    db.query.goalContributions.findMany({
      where: eq(goalContributions.userId, userId),
      orderBy: (c, { desc }) => [desc(c.contributionDate)],
    }),
  ]);

  return goalRows.map((goal) => ({
    ...goal,
    contributions: contributionRows.filter((c) => c.goalId === goal.id),
    progress: calculateGoalProgress(
      { id: goal.id, targetAmountMinor: goal.targetAmountMinor },
      contributionRows,
    ),
  }));
}

export interface CreateGoalInput {
  name: string;
  targetAmountMinor: number;
  targetDate?: string | null;
  icon?: string;
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const [goal] = await db
    .insert(goals)
    .values({ userId, ...input })
    .returning();
  return goal;
}

export type UpdateGoalInput = Partial<CreateGoalInput> & { isArchived?: boolean };

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
  const [goal] = await db
    .update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();
  return goal;
}

export async function deleteGoal(userId: string, goalId: string) {
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}

export interface AddContributionInput {
  goalId: string;
  amountMinor: number;
  contributionDate: string;
  notes?: string;
}

export async function addContribution(userId: string, input: AddContributionInput) {
  const [contribution] = await db
    .insert(goalContributions)
    .values({ userId, ...input })
    .returning();
  return contribution;
}

export async function deleteContribution(userId: string, contributionId: string) {
  await db
    .delete(goalContributions)
    .where(
      and(eq(goalContributions.id, contributionId), eq(goalContributions.userId, userId)),
    );
}
