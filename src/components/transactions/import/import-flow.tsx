"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentPicker } from "@/components/transactions/import/attachment-picker";
import { ReviewTable } from "@/components/transactions/import/review-table";
import { toReviewRow, type ReviewRow } from "@/components/transactions/import/review-row";
import { extractTransactionsAction } from "@/lib/actions/import";
import { bulkCreateTransactionsAction } from "@/lib/actions/transactions";
import type { Account } from "@/lib/data/accounts";
import type { Category } from "@/lib/data/categories";

export function ImportFlow({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, startExtracting] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleExtract() {
    setError(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    startExtracting(async () => {
      const result = await extractTransactionsAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      const extracted = result.transactions ?? [];
      if (extracted.length === 0) {
        setError("No transactions were found in those files.");
        return;
      }
      setRows(extracted.map(toReviewRow));
    });
  }

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? prev);
  }

  function removeRow(id: string) {
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? prev);
  }

  function handleImport() {
    if (!rows) return;
    setError(null);

    const included = rows.filter((r) => r.included);
    if (included.length === 0) {
      setError("Select at least one transaction to import.");
      return;
    }
    if (!accountId) {
      setError("Choose an account for these transactions.");
      return;
    }

    const amounts = included.map((r) => Number(r.amount));
    if (amounts.some((a) => !Number.isFinite(a) || a <= 0)) {
      setError("Every included row needs a valid amount greater than zero.");
      return;
    }

    startImporting(async () => {
      const result = await bulkCreateTransactionsAction(
        included.map((r) => ({
          accountId,
          type: r.type,
          amount: Number(r.amount),
          currency: "MYR",
          transactionDate: r.date,
          merchant: r.merchant || undefined,
          categoryId: r.categoryId || null,
        })),
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(`Imported ${result.count} transaction${result.count === 1 ? "" : "s"}.`);
      router.push("/transactions");
    });
  }

  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      {!rows ? (
        <div className="space-y-4">
          <AttachmentPicker files={files} onChange={setFiles} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button onClick={handleExtract} disabled={files.length === 0 || isExtracting}>
            <Sparkles className="size-4" />
            {isExtracting ? "Reading…" : "Extract transactions"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRows(null)}>
              <ArrowLeft className="size-4" />
              Back to files
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Import into</span>
              <Select items={accountItems} value={accountId} onValueChange={(v) => setAccountId(v ?? "")}>
                <SelectTrigger className="w-[12rem]">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Found {rows.length} transaction{rows.length === 1 ? "" : "s"}. Review, edit or uncheck
            any before importing — categories are optional and can be set later.
          </p>

          <ReviewTable rows={rows} categories={categories} onChange={updateRow} onRemove={removeRow} />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting
              ? "Importing…"
              : `Import ${rows.filter((r) => r.included).length} transaction${
                  rows.filter((r) => r.included).length === 1 ? "" : "s"
                }`}
          </Button>
        </div>
      )}
    </div>
  );
}
