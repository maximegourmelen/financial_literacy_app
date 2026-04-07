import { QUOTE_CACHE_MINUTES, STARTER_ASSETS } from "@/lib/config";
import { roundToScale, toNumber } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase";
import { AssetCatalogItem, QuoteCacheRow, QuoteSnapshot } from "@/lib/types";

function getQuoteAgeMinutes(fetchedAt: string) {
  return (Date.now() - new Date(fetchedAt).getTime()) / 60000;
}

async function fetchTwelveDataPrice(quoteSymbol: string): Promise<number> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not configured.");
  }

  const url = new URL("https://api.twelvedata.com/price");
  url.searchParams.set("symbol", quoteSymbol);
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString(), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Quote request failed for ${quoteSymbol}.`);
  }

  const payload = (await response.json()) as { price?: string; status?: string; message?: string };
  if (!payload.price) {
    throw new Error(payload.message || `No quote returned for ${quoteSymbol}.`);
  }

  return Number(payload.price);
}

export async function getAssetCatalog(): Promise<AssetCatalogItem[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("asset_catalog")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return STARTER_ASSETS.map((asset, index) => ({
      symbol: asset.symbol,
      name: asset.name,
      asset_type: asset.assetType,
      quote_symbol: asset.quoteSymbol,
      is_active: true,
      display_order: index + 1,
      created_at: new Date().toISOString()
    }));
  }

  return data as AssetCatalogItem[];
}

export async function getCachedQuote(symbol: string): Promise<QuoteCacheRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("quotes_cache")
    .select("*")
    .eq("symbol", symbol)
    .maybeSingle<QuoteCacheRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function upsertQuoteCache(row: QuoteCacheRow) {
  const { error } = await getSupabaseAdmin().from("quotes_cache").upsert(row);
  if (error) {
    throw new Error(error.message);
  }
}

function toQuoteSnapshot(asset: AssetCatalogItem, row: QuoteCacheRow | null): QuoteSnapshot {
  const fetchedAt = row?.fetched_at ?? null;
  const isStale = fetchedAt ? getQuoteAgeMinutes(fetchedAt) > QUOTE_CACHE_MINUTES : true;

  return {
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.asset_type,
    priceUsd: row ? toNumber(row.price_usd) : null,
    priceHkd: row ? toNumber(row.price_hkd) : null,
    fxUsdHkd: row ? toNumber(row.fx_usd_hkd) : null,
    fetchedAt,
    isStale
  };
}

export async function refreshQuote(asset: AssetCatalogItem): Promise<QuoteSnapshot> {
  const fxRate = await fetchTwelveDataPrice("USD/HKD");
  const assetPriceUsd = await fetchTwelveDataPrice(asset.quote_symbol);
  const now = new Date().toISOString();

  const row: QuoteCacheRow = {
    symbol: asset.symbol,
    price_usd: roundToScale(assetPriceUsd, 6),
    fx_usd_hkd: roundToScale(fxRate, 6),
    price_hkd: roundToScale(assetPriceUsd * fxRate, 4),
    fetched_at: now,
    source: "twelve_data"
  };

  await upsertQuoteCache(row);
  return toQuoteSnapshot(asset, row);
}

export async function getQuoteForSymbol(symbol: string, forceRefresh = false) {
  const assets = await getAssetCatalog();
  const asset = assets.find((entry) => entry.symbol === symbol);

  if (!asset) {
    throw new Error("That asset is not available in the starter catalog.");
  }

  const cached = await getCachedQuote(symbol);
  if (!forceRefresh && cached && getQuoteAgeMinutes(cached.fetched_at) <= QUOTE_CACHE_MINUTES) {
    return toQuoteSnapshot(asset, cached);
  }

  try {
    return await refreshQuote(asset);
  } catch (error) {
    if (cached) {
      return toQuoteSnapshot(asset, cached);
    }

    throw error;
  }
}

export async function getQuotesForSymbols(symbols: string[], forceRefresh = false) {
  const uniqueSymbols = [...new Set(symbols)];
  const results = await Promise.all(uniqueSymbols.map((symbol) => getQuoteForSymbol(symbol, forceRefresh)));
  return new Map(results.map((quote) => [quote.symbol, quote]));
}

export async function getStarterWatchlist(forceRefresh = false) {
  const assets = await getAssetCatalog();
  const quotes = await Promise.all(
    assets.map(async (asset) => {
      try {
        return await getQuoteForSymbol(asset.symbol, forceRefresh);
      } catch {
        const cached = await getCachedQuote(asset.symbol);
        return toQuoteSnapshot(asset, cached);
      }
    })
  );

  return quotes;
}
