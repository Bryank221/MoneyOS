import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export type Category = typeof categories.$inferSelect;

/** Default (system) categories plus the user's own custom categories. */
export async function listCategories(userId: string): Promise<Category[]> {
  return db.query.categories.findMany({
    where: or(eq(categories.userId, userId), isNull(categories.userId)),
    orderBy: (c, { asc }) => [asc(c.kind), asc(c.name)],
  });
}

export interface CreateCategoryInput {
  name: string;
  kind: Category["kind"];
  icon?: string;
  color?: string;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const [category] = await db
    .insert(categories)
    .values({ userId, isDefault: false, ...input })
    .returning();
  return category;
}

export async function deleteCategory(userId: string, categoryId: string) {
  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
}
