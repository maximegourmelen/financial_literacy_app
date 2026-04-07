import { randomUUID } from "node:crypto";

import { ACCOUNT_LABELS } from "@/lib/config";
import { parsePositiveAmount, roundToScale, toNumber } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  AccountType,
  AppUser,
  BalanceSnapshot,
  LedgerEntry,
  LedgerEntryType
} from "@/lib/types";
import { getBusinessDate } from "@/lib/time";

const EMPTY_BALANCES: BalanceSnapshot = {
  checking: 0,
  savings: 0,
  investment_cash: 0
};

export async function getChildUsers(): Promise<Pick<AppUser, "id" | "display_name" | "username">[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_users")
    .select("id, display_name, username")
    .eq("role", "child")
    .order("display_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Pick<AppUser, "id" | "display_name" | "username">[];
}

export async function getLedgerEntriesForUser(
  userId: string,
  limit = 50
): Promise<LedgerEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LedgerEntry[];
}

export async function getAllRecentLedgerEntries(limit = 100): Promise<LedgerEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LedgerEntry[];
}

export async function getBalancesForUser(userId: string): Promise<BalanceSnapshot> {
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("account_type, amount_hkd")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce<BalanceSnapshot>((balances, row) => {
    const accountType = row.account_type as AccountType;
    balances[accountType] = roundToScale(
      balances[accountType] + toNumber(row.amount_hkd),
      4
    );
    return balances;
  }, { ...EMPTY_BALANCES });
}

export async function getBalancesForAllChildren() {
  const children = await getChildUsers();
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("user_id, account_type, amount_hkd");

  if (error) {
    throw new Error(error.message);
  }

  const byUser = new Map<string, BalanceSnapshot>();
  for (const child of children) {
    byUser.set(child.id, { ...EMPTY_BALANCES });
  }

  for (const row of data ?? []) {
    const balances = byUser.get(row.user_id);
    if (!balances) {
      continue;
    }

    const accountType = row.account_type as AccountType;
    balances[accountType] = roundToScale(
      balances[accountType] + toNumber(row.amount_hkd),
      4
    );
  }

  return children.map((child) => ({
    ...child,
    balances: byUser.get(child.id) ?? { ...EMPTY_BALANCES }
  }));
}

async function insertLedgerRows(rows: Array<Record<string, unknown>>) {
  const { error } = await getSupabaseAdmin().from("ledger_entries").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function createCashTransaction(params: {
  userId: string;
  direction: "deposit" | "withdrawal";
  amountHkd: number;
  description?: string;
}) {
  const balances = await getBalancesForUser(params.userId);

  if (params.direction === "withdrawal" && balances.checking < params.amountHkd) {
    throw new Error("Not enough money in checking for that withdrawal.");
  }

  await insertLedgerRows([
    {
      user_id: params.userId,
      account_type: "checking",
      entry_type: params.direction,
      amount_hkd: params.direction === "deposit" ? params.amountHkd : -params.amountHkd,
      business_date: getBusinessDate(),
      description:
        params.description?.trim() ||
        (params.direction === "deposit"
          ? "Cash deposited with parents"
          : "Cash withdrawn from parents"),
      metadata: {
        source: "self-service"
      }
    }
  ]);
}

export async function createTransfer(params: {
  userId: string;
  fromAccount: AccountType;
  toAccount: AccountType;
  amountHkd: number;
  description?: string;
}) {
  if (params.fromAccount === params.toAccount) {
    throw new Error("Choose two different accounts for the transfer.");
  }

  const balances = await getBalancesForUser(params.userId);
  if (balances[params.fromAccount] < params.amountHkd) {
    throw new Error(`Not enough money in ${ACCOUNT_LABELS[params.fromAccount]}.`);
  }

  const groupId = randomUUID();
  const today = getBusinessDate();
  const description =
    params.description?.trim() ||
    `Transfer from ${ACCOUNT_LABELS[params.fromAccount]} to ${ACCOUNT_LABELS[params.toAccount]}`;

  await insertLedgerRows([
    {
      user_id: params.userId,
      account_type: params.fromAccount,
      entry_type: "transfer_out",
      amount_hkd: -params.amountHkd,
      business_date: today,
      description,
      group_id: groupId,
      metadata: {
        toAccount: params.toAccount
      }
    },
    {
      user_id: params.userId,
      account_type: params.toAccount,
      entry_type: "transfer_in",
      amount_hkd: params.amountHkd,
      business_date: today,
      description,
      group_id: groupId,
      metadata: {
        fromAccount: params.fromAccount
      }
    }
  ]);
}

export function getBalanceHeadline(entries: BalanceSnapshot) {
  return [
    { key: "checking", label: ACCOUNT_LABELS.checking, value: entries.checking },
    { key: "savings", label: ACCOUNT_LABELS.savings, value: entries.savings },
    { key: "investment_cash", label: ACCOUNT_LABELS.investment_cash, value: entries.investment_cash }
  ];
}

export function parseAccountType(raw: FormDataEntryValue | null): AccountType | null {
  if (raw === "checking" || raw === "savings" || raw === "investment_cash") {
    return raw;
  }

  return null;
}

export function parseCashDirection(
  raw: FormDataEntryValue | null
): "deposit" | "withdrawal" | null {
  return raw === "deposit" || raw === "withdrawal" ? raw : null;
}

export function parseLedgerAmount(raw: FormDataEntryValue | null) {
  return parsePositiveAmount(raw);
}

export function toSignedAmount(entryType: LedgerEntryType, amountHkd: number): number {
  return entryType === "withdrawal" || entryType === "transfer_out" || entryType === "buy"
    ? -amountHkd
    : amountHkd;
}
