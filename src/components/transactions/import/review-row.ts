import type { ExtractedTransaction } from "@/lib/ai/extract-transactions";

export interface ReviewRow {
  id: string;
  included: boolean;
  date: string;
  merchant: string;
  amount: string;
  type: "income" | "expense";
  categoryId: string;
}

let counter = 0;
function nextId() {
  counter += 1;
  return `row-${counter}`;
}

export function toReviewRow(extracted: ExtractedTransaction): ReviewRow {
  return {
    id: nextId(),
    included: true,
    date: extracted.date,
    merchant: extracted.merchant,
    amount: extracted.amount.toFixed(2),
    type: extracted.direction,
    categoryId: "",
  };
}
