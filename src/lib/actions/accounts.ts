"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { majorToMinor } from "@/lib/money";
import * as accountsData from "@/lib/data/accounts";
import type { ActionState } from "@/lib/actions/types";

export type { ActionState } from "@/lib/actions/types";

const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  type: z.enum(["bank", "cash", "e_wallet", "credit_card", "other"]),
  currency: z.string().trim().length(3).default("MYR"),
  initialBalance: z.coerce.number().finite(),
});

export async function createAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency") || "MYR",
    initialBalance: formData.get("initialBalance") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await accountsData.createAccount(user.id, {
    name: parsed.data.name,
    type: parsed.data.type,
    currency: parsed.data.currency,
    initialBalanceMinor: majorToMinor(parsed.data.initialBalance),
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/net-worth");
  return { success: true };
}

export async function updateAccountAction(
  accountId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency") || "MYR",
    initialBalance: formData.get("initialBalance") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await accountsData.updateAccount(user.id, accountId, {
    name: parsed.data.name,
    type: parsed.data.type,
    currency: parsed.data.currency,
    initialBalanceMinor: majorToMinor(parsed.data.initialBalance),
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/net-worth");
  return { success: true };
}

export async function deleteAccountAction(accountId: string) {
  const user = await requireUser();
  await accountsData.deleteAccount(user.id, accountId);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/net-worth");
}
