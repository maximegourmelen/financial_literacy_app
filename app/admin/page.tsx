import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { getAllRecentLedgerEntries, getBalancesForAllChildren } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import {
  ensureSavingsInterestUpToDate,
  getCurrentSavingsRate,
  getSavingsRateHistory
} from "@/lib/interest";
import { formatMoney, toNumber } from "@/lib/money";
import { getBusinessDate, formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("admin");
  await ensureSavingsInterestUpToDate();

  const [children, recentEntries, currentRate, rateHistory] = await Promise.all([
    getBalancesForAllChildren(),
    getAllRecentLedgerEntries(80),
    getCurrentSavingsRate(),
    getSavingsRateHistory(20)
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;
  const nameByUserId = new Map(children.map((child) => [child.id, child.display_name]));

  return (
    <AppShell
      role="admin"
      currentPath="/admin"
      title="Admin portal"
      subtitle="Review sibling balances, keep up with recent activity, and set the savings APR."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="two-column">
        <article className="table-card">
          <h2>Sibling balances</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Checking</th>
                  <th>Savings</th>
                  <th>Investments cash</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id}>
                    <td>
                      <strong>{child.display_name}</strong>
                      <div className="small-note">@{child.username}</div>
                    </td>
                    <td>{formatMoney(child.balances.checking)}</td>
                    <td>{formatMoney(child.balances.savings)}</td>
                    <td>{formatMoney(child.balances.investment_cash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <h2>Set savings APR</h2>
          <p className="small-note">
            Current active rate: {toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}% APR.
          </p>
          <form action="/api/admin/rates" method="post">
            <input type="hidden" name="returnTo" value="/admin" />
            <label>
              <span>APR percent</span>
              <input name="aprPercent" inputMode="decimal" placeholder="4.50" required />
            </label>
            <label>
              <span>Effective date</span>
              <input name="effectiveDate" type="date" defaultValue={getBusinessDate()} required />
            </label>
            <SubmitButton className="primary-button">Save new rate</SubmitButton>
          </form>

          <div style={{ marginTop: 18 }}>
            <h2 style={{ marginBottom: 10 }}>Recent rate history</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Effective date</th>
                    <th>APR</th>
                  </tr>
                </thead>
                <tbody>
                  {rateHistory.map((rate) => (
                    <tr key={rate.id}>
                      <td>{rate.effective_date}</td>
                      <td>{toNumber(rate.apr_percent).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 22 }}>
        <h2>Recent ledger activity</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Account</th>
                <th>Type</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.created_at)}</td>
                  <td>{nameByUserId.get(entry.user_id) ?? "Unknown user"}</td>
                  <td>{entry.account_type.replaceAll("_", " ")}</td>
                  <td>{entry.entry_type.replaceAll("_", " ")}</td>
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
