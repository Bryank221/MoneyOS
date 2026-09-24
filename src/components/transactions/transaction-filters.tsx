"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
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
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>

      <Select
        defaultValue={searchParams.get("type") ?? ALL}
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
        defaultValue={searchParams.get("accountId") ?? ALL}
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
        defaultValue={searchParams.get("categoryId") ?? ALL}
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
        defaultValue={`${searchParams.get("sortBy") ?? "date"}:${searchParams.get("sortDir") ?? "desc"}`}
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
