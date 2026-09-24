import { Banknote, Landmark, Smartphone, CreditCard, Wallet2, type LucideIcon } from "lucide-react";
import type { Account } from "@/lib/data/accounts";

export const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  bank: "Bank",
  cash: "Cash",
  e_wallet: "E-Wallet",
  credit_card: "Credit Card",
  other: "Other",
};

export const ACCOUNT_TYPE_ICONS: Record<Account["type"], LucideIcon> = {
  bank: Landmark,
  cash: Banknote,
  e_wallet: Smartphone,
  credit_card: CreditCard,
  other: Wallet2,
};

export const ACCOUNT_TYPES: Account["type"][] = [
  "bank",
  "cash",
  "e_wallet",
  "credit_card",
  "other",
];
