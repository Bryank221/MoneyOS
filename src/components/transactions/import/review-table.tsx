"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Category } from "@/lib/data/categories";
import type { ReviewRow } from "@/components/transactions/import/review-row";

const UNCATEGORIZED = "uncategorized";

export function ReviewTable({
  rows,
  categories,
  onChange,
  onRemove,
}: {
  rows: ReviewRow[];
  categories: Category[];
  onChange: (id: string, patch: Partial<ReviewRow>) => void;
  onRemove: (id: string) => void;
}) {
  const typeItems = { income: "Income", expense: "Expense" };

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-9" />
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount (RM)</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="w-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const categoryItems = {
              [UNCATEGORIZED]: "Uncategorized",
              ...Object.fromEntries(
                categories.filter((c) => c.kind === row.type).map((c) => [c.id, c.name]),
              ),
            };
            return (
              <TableRow key={row.id} className={!row.included ? "opacity-50" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={row.included}
                    onCheckedChange={(checked) => onChange(row.id, { included: checked === true })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) => onChange(row.id, { date: e.target.value })}
                    className="w-[9.5rem]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.merchant}
                    onChange={(e) => onChange(row.id, { merchant: e.target.value })}
                    className="min-w-[10rem]"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    items={typeItems}
                    value={row.type}
                    onValueChange={(v) =>
                      v && onChange(row.id, { type: v as "income" | "expense", categoryId: "" })
                    }
                  >
                    <SelectTrigger className="w-[6.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.amount}
                    onChange={(e) => onChange(row.id, { amount: e.target.value })}
                    className="w-24 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    items={categoryItems}
                    value={row.categoryId || UNCATEGORIZED}
                    onValueChange={(v) =>
                      onChange(row.id, { categoryId: v === UNCATEGORIZED ? "" : v ?? "" })
                    }
                  >
                    <SelectTrigger className="w-[10rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
                      {categories
                        .filter((c) => c.kind === row.type)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
