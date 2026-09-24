"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteButton } from "@/components/delete-button";
import {
  createCategoryAction,
  deleteCategoryAction,
  type ActionState,
} from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";

const initialState: ActionState = {};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createCategoryAction,
    initialState,
  );
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input type="hidden" name="kind" value={kind} />
        <Input name="name" placeholder="Category name" required className="flex-1" />
        <Select
          items={{ expense: "Expense", income: "Income" }}
          value={kind}
          onValueChange={(v) => setKind(v as "expense" | "income")}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isPending}>
          <Plus className="size-4" />
          Add
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="space-y-4">
        <CategoryGroup title="Expense categories" categories={expenseCategories} />
        <CategoryGroup title="Income categories" categories={incomeCategories} />
      </div>
    </div>
  );
}

function CategoryGroup({ title, categories }: { title: string; categories: Category[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1.5">
            {c.name}
            {!c.isDefault ? (
              <DeleteButton
                action={() => deleteCategoryAction(c.id)}
                title={`Delete ${c.name}?`}
                description="Existing transactions using this category will lose their category."
                label={`Delete ${c.name}`}
              />
            ) : null}
          </Badge>
        ))}
      </div>
    </div>
  );
}
