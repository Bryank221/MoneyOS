"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import * as categoriesData from "@/lib/data/categories";
import type { ActionState } from "@/lib/actions/types";
export type { ActionState } from "@/lib/actions/types";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
  kind: z.enum(["income", "expense"]),
});

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await categoriesData.createCategory(user.id, parsed.data);

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string) {
  const user = await requireUser();
  await categoriesData.deleteCategory(user.id, categoryId);
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}
