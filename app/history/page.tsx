import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { getLedgerEntriesForUser } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { getTradesForUser } from "@/lib/investments";
import { formatMoney, formatUnits, toNumber } from "@/lib/money";
import { formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HistoryPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("child");
  await ensureSavingsInterestUpToDate();

  const [ledgerEntries, trades] = await Promise.all([
    getLedgerEntriesForUser(session.userId, 120),
    getTradesForUser(session.userId, 60)
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AppShell
      role="child"
      currentPath="/history"
      title="Activity history"
      subtitle="Every balance change is stored in the ledger so your family can always audit what happened."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="two-column">
        <article className="table-card">
          <h2>Ledger entries</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.created_at)}</td>
                    <td>{entry.account_type.replaceAll("_", " ")}</td>
                    <td>{entry.entry_type.replaceAll("_", " ")}</td>
                    <td>{entry.description || "No note"}</td>
                    <td>{formatMoney(toNumber(entry.amount_hkd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="table-card">
          <h2>Investment trades</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Side</th>
                  <th>Asset</th>
                  <th>Quantity</th>
                  <th>Price HKD</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{formatDateTime(trade.executed_at)}</td>
                    <td>{trade.side}</td>
                    <td>{trade.symbol}</td>
                    <td>{formatUnits(Number(trade.quantity), 8)}</td>
                    <td>{formatMoney(Number(trade.price_hkd))}</td>
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
