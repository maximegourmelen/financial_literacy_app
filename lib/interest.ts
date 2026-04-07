import { getBalancesForUser, getChildUsers } from "@/lib/accounts";
import { roundToScale, toNumber } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SavingsRate } from "@/lib/types";
import { addDays, compareBusinessDates, getBusinessDate, listDatesInclusive } from "@/lib/time";

export async function getSavingsRateHistory(limit = 30): Promise<SavingsRate[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("savings_rates")
    .select("*")
    .order("effective_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavingsRate[];
}

export async function getCurrentSavingsRate(): Promise<SavingsRate | null> {
  const today = getBusinessDate();
  const { data, error } = await getSupabaseAdmin()
    .from("savings_rates")
    .select("*")
    .lte("effective_date", today)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle<SavingsRate>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createSavingsRate(params: {
  aprPercent: number;
  effectiveDate: string;
  createdBy: string;
}) {
  if (params.aprPercent < 0 || params.aprPercent > 100) {
    throw new Error("APR must stay between 0% and 100%.");
  }

  const { error } = await getSupabaseAdmin().from("savings_rates").insert({
    apr_percent: roundToScale(params.aprPercent, 4),
    effective_date: params.effectiveDate,
    created_by: params.createdBy
  });

  if (error) {
    throw new Error(error.message);
  }
}

function getApplicableAprPercent(date: string, rates: SavingsRate[]): number {
  const applicable = rates
    .filter((rate) => compareBusinessDates(rate.effective_date, date) <= 0)
    .sort((left, right) => right.effective_date.localeCompare(left.effective_date))[0];

  return applicable ? toNumber(applicable.apr_percent) : 0;
}

async function getLastCompletedInterestDate(): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("interest_runs")
    .select("business_date")
    .eq("status", "completed")
    .order("business_date", { ascending: false })
    .limit(1)
    .maybeSingle<{ business_date: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.business_date ?? null;
}

async function getMostRecentSavingsCreditDate(userId: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("business_date")
    .eq("user_id", userId)
    .eq("account_type", "savings")
    .eq("entry_type", "interest_credit")
    .order("business_date", { ascending: false })
    .limit(1)
    .maybeSingle<{ business_date: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.business_date ?? null;
}

export async function getLastInterestCreditDate(userId: string) {
  return getMostRecentSavingsCreditDate(userId);
}

async function getOpeningSavingsBalance(userId: string, targetDate: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("ledger_entries")
    .select("amount_hkd")
    .eq("user_id", userId)
    .eq("account_type", "savings")
    .lt("business_date", targetDate);

  if (error) {
    throw new Error(error.message);
  }

  return roundToScale(
    (data ?? []).reduce((sum, row) => sum + toNumber(row.amount_hkd), 0),
    4
  );
}

async function insertInterestRun(
  businessDate: string,
  aprPercent: number,
  status: "completed"
) {
  const { error } = await getSupabaseAdmin().from("interest_runs").upsert({
    business_date: businessDate,
    applied_apr_percent: aprPercent,
    status,
    completed_at: new Date().toISOString()
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function ensureSavingsInterestUpToDate() {
  const today = getBusinessDate();
  const [lastCompletedDate, rates, children] = await Promise.all([
    getLastCompletedInterestDate(),
    getSavingsRateHistory(200),
    getChildUsers()
  ]);

  const firstProcessingDate = lastCompletedDate ? addDays(lastCompletedDate, 1) : today;
  const datesToProcess = listDatesInclusive(firstProcessingDate, today);

  for (const businessDate of datesToProcess) {
    const aprPercent = getApplicableAprPercent(businessDate, rates);
    const dailyRate = aprPercent / 100 / 365;

    for (const child of children) {
      const openingBalance = await getOpeningSavingsBalance(child.id, businessDate);
      if (openingBalance <= 0 || dailyRate <= 0) {
        continue;
      }

      const amount = roundToScale(openingBalance * dailyRate, 4);
      if (amount <= 0) {
        continue;
      }

      const existingCreditDate = await getMostRecentSavingsCreditDate(child.id);
      if (existingCreditDate === businessDate) {
        continue;
      }

      const { error } = await getSupabaseAdmin().from("ledger_entries").insert({
        user_id: child.id,
        account_type: "savings",
        entry_type: "interest_credit",
        amount_hkd: amount,
        business_date: businessDate,
        description: `Daily savings interest at ${aprPercent.toFixed(2)}% APR`,
        metadata: {
          aprPercent,
          dailyRate,
          openingBalance
        }
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    await insertInterestRun(businessDate, aprPercent, "completed");
  }
}

export async function getSavingsSummary(userId: string) {
  const [balance, currentRate, lastInterestDate] = await Promise.all([
    getBalancesForUser(userId),
    getCurrentSavingsRate(),
    getLastInterestCreditDate(userId)
  ]);

  return {
    balance: balance.savings,
    currentRatePercent: currentRate ? toNumber(currentRate.apr_percent) : 0,
    lastInterestDate
  };
}
