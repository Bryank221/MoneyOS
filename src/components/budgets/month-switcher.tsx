"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function MonthSwitcher({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = new Date(month + "T00:00:00Z");

  function go(offset: number) {
    const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1));
    const key = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`;
    router.push(`${pathname}?month=${key}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[9rem] text-center text-sm font-medium">
        {format(current, "MMMM yyyy")}
      </span>
      <Button variant="outline" size="icon" onClick={() => go(1)}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
