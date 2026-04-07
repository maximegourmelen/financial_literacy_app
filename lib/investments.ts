import { randomUUID } from "node:crypto";

import { getBalancesForUser } from "@/lib/accounts";
import { getAssetCatalog, getQuoteForSymbol, getQuotesForSymbols } from "@/lib/quotes";
import { formatUnits, roundToScale, toNumber } from "@/lib/money";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  AssetCatalogItem,
  InvestmentTrade,
  OrderMode,
  PositionSnapshot,
  TradeSide
} from "@/lib/types";
import { getBusinessDate } from "@/lib/time";

type PositionAccumulator = {
  quantity: number;
  costBasisHkd: number;
  realizedPnlHkd: number;
};

export async function getTradesForUser(userId: string, limit = 100): Promise<InvestmentTrade[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("investment_trades")
    .select("*")
    .eq("user_id", userId)
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InvestmentTrade[];
}

export async function getOpenPositions(userId: string): Promise<PositionSnapshot[]> {
  const assets = await getAssetCatalog();
  const assetMap = new Map(assets.map((asset) => [asset.symbol, asset]));
  const { data, error } = await getSupabaseAdmin()
    .from("investment_trades")
    .select("*")
    .eq("user_id", userId)
    .order("executed_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const trades = (data ?? []) as InvestmentTrade[];
  const positions = new Map<string, PositionAccumulator>();

  for (const trade of trades) {
    const quantity = toNumber(trade.quantity);
    const grossHkd = toNumber(trade.gross_hkd);
    const current = positions.get(trade.symbol) ?? {
      quantity: 0,
      costBasisHkd: 0,
      realizedPnlHkd: 0
    };

    if (trade.side === "buy") {
      current.quantity = roundToScale(current.quantity + quantity, 8);
      current.costBasisHkd = roundToScale(current.costBasisHkd + grossHkd, 4);
    } else {
      if (current.quantity <= 0) {
        continue;
      }

      const averageCost = current.costBasisHkd / current.quantity;
      const removedCost = averageCost * quantity;

      current.quantity = roundToScale(current.quantity - quantity, 8);
      current.costBasisHkd = roundToScale(current.costBasisHkd - removedCost, 4);
      current.realizedPnlHkd = roundToScale(
        current.realizedPnlHkd + (grossHkd - removedCost),
        4
      );
    }

    if (current.quantity <= 0.00000001) {
      current.quantity = 0;
      current.costBasisHkd = 0;
    }

    positions.set(trade.symbol, current);
  }

  const activeSymbols = [...positions.entries()]
    .filter(([, value]) => value.quantity > 0)
    .map(([symbol]) => symbol);

  const quoteMap = await getQuotesForSymbols(activeSymbols);

  return activeSymbols.map((symbol) => {
    const asset = assetMap.get(symbol) as AssetCatalogItem;
    const position = positions.get(symbol) as PositionAccumulator;
    const quote = quoteMap.get(symbol);
    const marketValueHkd = quote?.priceHkd
      ? roundToScale(position.quantity * quote.priceHkd, 4)
      : null;
    const unrealizedPnlHkd =
      marketValueHkd === null ? null : roundToScale(marketValueHkd - position.costBasisHkd, 4);

    return {
      symbol,
      name: asset.name,
      assetType: asset.asset_type,
      quantity: position.quantity,
      averageCostHkd:
        position.quantity > 0
          ? roundToScale(position.costBasisHkd / position.quantity, 4)
          : 0,
      costBasisHkd: position.costBasisHkd,
      marketPriceHkd: quote?.priceHkd ?? null,
      marketValueHkd,
      unrealizedPnlHkd,
      unrealizedPnlPct:
        marketValueHkd !== null && position.costBasisHkd > 0
          ? (marketValueHkd - position.costBasisHkd) / position.costBasisHkd
          : null,
      realizedPnlHkd: position.realizedPnlHkd,
      lastUpdated: quote?.fetchedAt ?? null
    };
  });
}

export async function executeTrade(params: {
  userId: string;
  symbol: string;
  side: TradeSide;
  orderMode: OrderMode;
  amountHkd?: number;
  quantity?: number;
}) {
  const [balances, assetCatalog, positions] = await Promise.all([
    getBalancesForUser(params.userId),
    getAssetCatalog(),
    getOpenPositions(params.userId)
  ]);

  const asset = assetCatalog.find((entry) => entry.symbol === params.symbol);
  if (!asset) {
    throw new Error("That asset is not available right now.");
  }

  const quote = await getQuoteForSymbol(asset.symbol, true);
  if (!quote.priceHkd || !quote.priceUsd || !quote.fxUsdHkd) {
    throw new Error("A fresh quote is not available for that asset yet.");
  }

  let quantity = params.quantity ?? 0;
  let grossHkd = params.amountHkd ?? 0;

  if (params.orderMode === "amount") {
    if (!params.amountHkd) {
      throw new Error("Enter a valid HKD amount.");
    }

    grossHkd = roundToScale(params.amountHkd, 4);
    quantity = roundToScale(grossHkd / quote.priceHkd, 8);
  } else {
    if (!params.quantity) {
      throw new Error("Enter a valid quantity.");
    }

    quantity = roundToScale(params.quantity, 8);
    grossHkd = roundToScale(quantity * quote.priceHkd, 4);
  }

  if (quantity <= 0 || grossHkd <= 0) {
    throw new Error("That trade is too small to process.");
  }

  if (params.side === "buy" && balances.investment_cash < grossHkd) {
    throw new Error("Not enough cash in the investments account.");
  }

  if (params.side === "sell") {
    const position = positions.find((entry) => entry.symbol === params.symbol);
    if (!position || position.quantity < quantity) {
      throw new Error(
        `You do not own enough ${params.symbol} to sell ${formatUnits(quantity, 8)} shares.`
      );
    }
  }

  const { data: insertedLedger, error: ledgerError } = await getSupabaseAdmin()
    .from("ledger_entries")
    .insert({
      user_id: params.userId,
      account_type: "investment_cash",
      entry_type: params.side,
      amount_hkd: params.side === "buy" ? -grossHkd : grossHkd,
      business_date: getBusinessDate(),
      description: `${params.side === "buy" ? "Bought" : "Sold"} ${params.symbol}`,
      group_id: randomUUID(),
      metadata: {
        symbol: params.symbol,
        quantity,
        priceHkd: quote.priceHkd
      }
    })
    .select("id")
    .single();

  if (ledgerError || !insertedLedger) {
    throw new Error(ledgerError?.message || "Could not create the trade cash entry.");
  }

  const { error: tradeError } = await getSupabaseAdmin().from("investment_trades").insert({
    user_id: params.userId,
    symbol: params.symbol,
    side: params.side,
    quantity,
    gross_hkd: grossHkd,
    price_usd: quote.priceUsd,
    price_hkd: quote.priceHkd,
    fx_usd_hkd: quote.fxUsdHkd,
    order_mode: params.orderMode,
    requested_amount_hkd: params.orderMode === "amount" ? grossHkd : null,
    requested_quantity: params.orderMode === "quantity" ? quantity : null,
    executed_at: new Date().toISOString(),
    ledger_entry_id: insertedLedger.id
  });

  if (tradeError) {
    throw new Error(tradeError.message);
  }
}
