"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { majorToMinor } from "@/lib/money";
import * as goalsData from "@/lib/data/goals";
import type { ActionState } from "@/lib/actions/types";
export type { ActionState } from "@/lib/actions/types";

const goalSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  targetAmount: z.coerce.number().positive("Target must be greater than zero."),
  targetDate: z.string().optional(),
});

function revalidateAll() {
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function createGoalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await goalsData.createGoal(user.id, {
    name: parsed.data.name,
    targetAmountMinor: majorToMinor(parsed.data.targetAmount),
    targetDate: parsed.data.targetDate || null,
  });

  revalidateAll();
  return { success: true };
}

export async function updateGoalAction(
  goalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await goalsData.updateGoal(user.id, goalId, {
    name: parsed.data.name,
    targetAmountMinor: majorToMinor(parsed.data.targetAmount),
    targetDate: parsed.data.targetDate || null,
  });

  revalidateAll();
  return { success: true };
}

export async function deleteGoalAction(goalId: string) {
  const user = await requireUser();
  await goalsData.deleteGoal(user.id, goalId);
  revalidateAll();
}

const contributionSchema = z.object({
  goalId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  contributionDate: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
});

export async function addContributionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contributionSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
    contributionDate: formData.get("contributionDate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await goalsData.addContribution(user.id, {
    goalId: parsed.data.goalId,
    amountMinor: majorToMinor(parsed.data.amount),
    contributionDate: parsed.data.contributionDate,
    notes: parsed.data.notes,
  });

  revalidateAll();
  return { success: true };
}

export async function deleteContributionAction(contributionId: string) {
  const user = await requireUser();
  await goalsData.deleteContribution(user.id, contributionId);
  revalidateAll();
}
