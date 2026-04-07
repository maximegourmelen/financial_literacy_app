import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { SummaryCard } from "@/components/summary-card";
import { SubmitButton } from "@/components/submit-button";
import { getBalancesForUser } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { getOpenPositions, getTradesForUser } from "@/lib/investments";
import { formatMoney, formatUnits, percentFromFraction } from "@/lib/money";
import { getStarterWatchlist } from "@/lib/quotes";
import { formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InvestmentsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("child");
  await ensureSavingsInterestUpToDate();

  const [balances, positions, watchlist, trades] = await Promise.all([
    getBalancesForUser(session.userId),
    getOpenPositions(session.userId),
    getStarterWatchlist(),
    getTradesForUser(session.userId, 20)
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AppShell
      role="child"
      currentPath="/investments"
      title="Investments account"
      subtitle="Fund your investing cash, then buy or sell your starter list in HKD."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="dashboard-grid">
        <SummaryCard
          label="Investments cash"
          value={formatMoney(balances.investment_cash)}
          detail="Available for new buys"
        />
        <SummaryCard
          label="Open positions"
          value={formatMoney(
            positions.reduce((sum, position) => sum + (position.marketValueHkd ?? 0), 0)
          )}
          detail={`${positions.length} active holdings`}
        />
        <SummaryCard
          label="Watchlist size"
          value={`${watchlist.length} assets`}
          detail="Starter assets"
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Fund your investments cash</h2>
          <form action="/api/transactions/transfer" method="post">
            <input type="hidden" name="returnTo" value="/investments" />
            <input type="hidden" name="toAccount" value="investment_cash" />
            <label>
              <span>Transfer from</span>
              <select name="fromAccount" defaultValue="checking">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </label>
            <label>
              <span>Amount (HKD)</span>
              <input name="amount" inputMode="decimal" placeholder="120.00" required />
            </label>
            <label>
              <span>Note</span>
              <textarea
                name="description"
                placeholder="Optional note, for example ETF purchase budget"
              />
            </label>
            <SubmitButton className="secondary-button">Move into investments</SubmitButton>
          </form>
        </article>

        <article className="panel">
          <h2>Trade an asset</h2>
          <form action="/api/trades" method="post">
            <input type="hidden" name="returnTo" value="/investments" />
            <label>
              <span>Side</span>
              <select name="side" defaultValue="buy">
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>
            <label>
              <span>Asset</span>
              <select name="symbol" defaultValue="VOO">
                {watchlist.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} · {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Order mode</span>
              <select name="orderMode" defaultValue="amount">
                <option value="amount">Buy or sell by HKD amount</option>
                <option value="quantity">Buy or sell by quantity</option>
              </select>
            </label>
            <label>
              <span>Amount (HKD)</span>
              <input name="amount" inputMode="decimal" placeholder="100.00" />
            </label>
            <label>
              <span>Quantity</span>
              <input name="quantity" inputMode="decimal" placeholder="0.250000" />
            </label>
            <SubmitButton className="primary-button">Submit trade</SubmitButton>
          </form>
          <p className="small-note">
            Enter the field that matches your selected order mode. Quotes are converted
            from USD to HKD using the latest cached USD/HKD rate.
          </p>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 22 }}>
        <h2>Open positions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Quantity</th>
                <th>Avg cost</th>
                <th>Market value</th>
                <th>Unrealized P/L</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={6}>No positions yet.</td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.symbol}>
                    <td>
                      <strong>{position.symbol}</strong>
                      <div className="small-note">{position.name}</div>
                    </td>
                    <td>{formatUnits(position.quantity, 8)}</td>
                    <td>{formatMoney(position.averageCostHkd)}</td>
                    <td>{formatMoney(position.marketValueHkd ?? 0)}</td>
                    <td>
                      <span
                        className={
                          position.unrealizedPnlHkd !== null && position.unrealizedPnlHkd >= 0
                            ? "pill positive"
                            : "pill negative"
                        }
                      >
                        {formatMoney(position.unrealizedPnlHkd ?? 0)} ·{" "}
                        {percentFromFraction(position.unrealizedPnlPct)}
                      </span>
                    </td>
                    <td>{formatDateTime(position.lastUpdated)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-column" style={{ marginTop: 22 }}>
        <article className="table-card">
          <h2>Starter watchlist</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Price (HKD)</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((quote) => (
                  <tr key={quote.symbol}>
                    <td>
                      <strong>{quote.symbol}</strong>
                      <div className="small-note">{quote.name}</div>
                    </td>
                    <td>{quote.priceHkd ? formatMoney(quote.priceHkd) : "Unavailable"}</td>
                    <td>
                      <span className={quote.isStale ? "pill negative" : "pill positive"}>
                        {quote.isStale ? "Cached / stale" : "Fresh quote"}
                      </span>
                    </td>
                    <td>{formatDateTime(quote.fetchedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="table-card">
          <h2>Recent trades</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Side</th>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Gross HKD</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{formatDateTime(trade.executed_at)}</td>
                    <td>{trade.side}</td>
                    <td>{trade.symbol}</td>
                    <td>{formatUnits(Number(trade.quantity), 8)}</td>
                    <td>{formatMoney(Number(trade.gross_hkd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
