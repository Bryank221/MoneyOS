"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/lib/data/accounts";
import type { Category } from "@/lib/data/categories";

const ALL = "all";

export function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  // Captured once: an uncontrolled input's `defaultValue` must never change
  // after mount (that's what triggers Base UI's warning), unlike the
  // Selects below, which stay in sync with the URL as a controlled `value`.
  const [initialSearch] = useState(() => searchParams.get("q") ?? "");

  const typeItems = {
    [ALL]: "All types",
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
  };
  const accountItems = useMemo(
    () => ({ [ALL]: "All accounts", ...Object.fromEntries(accounts.map((a) => [a.id, a.name])) }),
    [accounts],
  );
  const categoryItems = useMemo(
    () => ({
      [ALL]: "All categories",
      ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
    }),
    [categories],
  );
  const sortItems = {
    "date:desc": "Newest first",
    "date:asc": "Oldest first",
    "amount:desc": "Amount: high to low",
    "amount:asc": "Amount: low to high",
  };

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search merchant, description…"
          className="pl-8"
          defaultValue={initialSearch}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>

      <Select
        items={typeItems}
        value={searchParams.get("type") ?? ALL}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={accountItems}
        value={searchParams.get("accountId") ?? ALL}
        onValueChange={(v) => setParam("accountId", v)}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={categoryItems}
        value={searchParams.get("categoryId") ?? ALL}
        onValueChange={(v) => setParam("categoryId", v)}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={sortItems}
        value={`${searchParams.get("sortBy") ?? "date"}:${searchParams.get("sortDir") ?? "desc"}`}
        onValueChange={(v) => {
          if (!v) return;
          const [sortBy, sortDir] = v.split(":");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortDir", sortDir);
          startTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date:desc">Newest first</SelectItem>
          <SelectItem value="date:asc">Oldest first</SelectItem>
          <SelectItem value="amount:desc">Amount: high to low</SelectItem>
          <SelectItem value="amount:asc">Amount: low to high</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
