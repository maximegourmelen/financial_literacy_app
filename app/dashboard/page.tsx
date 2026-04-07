import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { SummaryCard } from "@/components/summary-card";
import { getBalancesForUser, getLedgerEntriesForUser } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { getCurrentSavingsRate, ensureSavingsInterestUpToDate } from "@/lib/interest";
import { formatMoney, toNumber } from "@/lib/money";
import { formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("child");
  await ensureSavingsInterestUpToDate();

  const [balances, recentEntries, currentRate] = await Promise.all([
    getBalancesForUser(session.userId),
    getLedgerEntriesForUser(session.userId, 12),
    getCurrentSavingsRate()
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <AppShell
      role="child"
      currentPath="/dashboard"
      title={`Hi ${session.displayName}`}
      subtitle="Here is your full family-money snapshot in Hong Kong dollars."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="dashboard-grid">
        <SummaryCard
          label="Checking"
          value={formatMoney(balances.checking)}
          detail="Cash ready to use"
        />
        <SummaryCard
          label="Savings"
          value={formatMoney(balances.savings)}
          detail={`APR ${toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}%`}
        />
        <SummaryCard
          label="Investments Cash"
          value={formatMoney(balances.investment_cash)}
          detail="Ready for buys and sells"
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <p className="eyebrow">How this works</p>
          <h2>Practice with real money habits.</h2>
          <p>
            Deposits and withdrawals update instantly here, but the real cash still moves
            through your parents. Transfers let you decide how much stays safe in savings
            and how much gets invested.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Savings reminder</p>
          <h2>Interest is credited daily.</h2>
          <p>
            Today&apos;s savings rate is{" "}
            <strong>{toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}%</strong> APR.
            Interest credits use your opening savings balance for each Hong Kong business date.
          </p>
        </article>
      </section>

      <section className="timeline-card" style={{ marginTop: 22 }}>
        <h2>Recent activity</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Account</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.created_at)}</td>
                  <td>{entry.entry_type.replaceAll("_", " ")}</td>
                  <td>{entry.account_type.replaceAll("_", " ")}</td>
                  <td>{entry.description || "No note"}</td>
                  <td>{formatMoney(toNumber(entry.amount_hkd))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
