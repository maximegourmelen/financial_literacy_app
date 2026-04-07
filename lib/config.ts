import { AccountType } from "@/lib/types";

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Family Savings Club";

export const HONG_KONG_TIMEZONE = "Asia/Hong_Kong";

export const QUOTE_CACHE_MINUTES = 20;

export const MAX_CHILD_ACCOUNTS = 2;

export const STARTER_ACCOUNT_ORDER: AccountType[] = [
  "checking",
  "savings",
  "investment_cash"
];

export const ACCOUNT_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  investment_cash: "Investments Cash"
};

export const STARTER_ASSETS = [
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", assetType: "etf", quoteSymbol: "VOO" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetType: "etf", quoteSymbol: "QQQ" },
  { symbol: "AAPL", name: "Apple", assetType: "stock", quoteSymbol: "AAPL" },
  { symbol: "MSFT", name: "Microsoft", assetType: "stock", quoteSymbol: "MSFT" },
  { symbol: "NVDA", name: "NVIDIA", assetType: "stock", quoteSymbol: "NVDA" },
  { symbol: "AMZN", name: "Amazon", assetType: "stock", quoteSymbol: "AMZN" },
  { symbol: "GOOG", name: "Alphabet", assetType: "stock", quoteSymbol: "GOOG" },
  { symbol: "META", name: "Meta", assetType: "stock", quoteSymbol: "META" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Class B", assetType: "stock", quoteSymbol: "BRK.B" },
  { symbol: "TSLA", name: "Tesla", assetType: "stock", quoteSymbol: "TSLA" },
  { symbol: "JPM", name: "JPMorgan Chase", assetType: "stock", quoteSymbol: "JPM" },
  { symbol: "AVGO", name: "Broadcom", assetType: "stock", quoteSymbol: "AVGO" },
  { symbol: "BTC", name: "Bitcoin", assetType: "crypto", quoteSymbol: "BTC/USD" },
  { symbol: "ETH", name: "Ethereum", assetType: "crypto", quoteSymbol: "ETH/USD" },
  { symbol: "SOL", name: "Solana", assetType: "crypto", quoteSymbol: "SOL/USD" },
  { symbol: "XRP", name: "XRP", assetType: "crypto", quoteSymbol: "XRP/USD" }
] as const;

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
