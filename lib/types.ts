export type UserRole = "child" | "admin";

export type AccountType = "checking" | "savings" | "investment_cash";

export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out"
  | "interest_credit"
  | "buy"
  | "sell";

export type TradeSide = "buy" | "sell";

export type OrderMode = "amount" | "quantity";

export type AssetType = "stock" | "etf" | "crypto";

export type SessionPayload = {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
  expiresAt: number;
};

export type AppUser = {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  user_id: string;
  account_type: AccountType;
  entry_type: LedgerEntryType;
  amount_hkd: number | string;
  business_date: string;
  description: string | null;
  group_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SavingsRate = {
  id: string;
  apr_percent: number | string;
  effective_date: string;
  created_by: string | null;
  created_at: string;
};

export type AssetCatalogItem = {
  symbol: string;
  name: string;
  asset_type: AssetType;
  quote_symbol: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

export type QuoteCacheRow = {
  symbol: string;
  price_usd: number | string;
  fx_usd_hkd: number | string;
  price_hkd: number | string;
  fetched_at: string;
  source: string;
};

export type InvestmentTrade = {
  id: string;
  user_id: string;
  symbol: string;
  side: TradeSide;
  quantity: number | string;
  gross_hkd: number | string;
  price_usd: number | string;
  price_hkd: number | string;
  fx_usd_hkd: number | string;
  order_mode: OrderMode;
  requested_amount_hkd: number | string | null;
  requested_quantity: number | string | null;
  executed_at: string;
  ledger_entry_id: string | null;
};

export type BalanceSnapshot = Record<AccountType, number>;

export type PositionSnapshot = {
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averageCostHkd: number;
  costBasisHkd: number;
  marketPriceHkd: number | null;
  marketValueHkd: number | null;
  unrealizedPnlHkd: number | null;
  unrealizedPnlPct: number | null;
  realizedPnlHkd: number;
  lastUpdated: string | null;
};

export type QuoteSnapshot = {
  symbol: string;
  name: string;
  assetType: AssetType;
  priceUsd: number | null;
  priceHkd: number | null;
  fxUsdHkd: number | null;
  fetchedAt: string | null;
  isStale: boolean;
};
