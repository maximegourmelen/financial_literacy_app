import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { SummaryCard } from "@/components/summary-card";
import { SubmitButton } from "@/components/submit-button";
import { getBalancesForUser, getLedgerEntriesForUser } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import {
  ensureSavingsInterestUpToDate,
  getCurrentSavingsRate,
  getLastInterestCreditDate
} from "@/lib/interest";
import { formatMoney, toNumber } from "@/lib/money";
import { formatBusinessDate, formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SavingsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("child");
  await ensureSavingsInterestUpToDate();

  const [balances, entries, currentRate, lastInterestDate] = await Promise.all([
    getBalancesForUser(session.userId),
    getLedgerEntriesForUser(session.userId, 40),
    getCurrentSavingsRate(),
    getLastInterestCreditDate(session.userId)
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;
  const savingsEntries = entries.filter((entry) => entry.account_type === "savings");

  return (
    <AppShell
      role="child"
      currentPath="/savings"
      title="Savings account"
      subtitle="Move money here when you want it to grow with daily compounded interest."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="dashboard-grid">
        <SummaryCard
          label="Savings balance"
          value={formatMoney(balances.savings)}
          detail={`APR ${toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}%`}
        />
        <SummaryCard
          label="Last interest credit"
          value={formatBusinessDate(lastInterestDate)}
          detail="Most recent daily credit"
        />
        <SummaryCard
          label="How it accrues"
          value={`${toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}% APR`}
          detail="Interest is credited daily"
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Transfer money into or out of savings</h2>
          <form action="/api/transactions/transfer" method="post">
            <input type="hidden" name="returnTo" value="/savings" />
            <label>
              <span>Move from</span>
              <select name="fromAccount" defaultValue="checking">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="investment_cash">Investments cash</option>
              </select>
            </label>
            <label>
              <span>Move to</span>
              <select name="toAccount" defaultValue="savings">
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
                <option value="investment_cash">Investments cash</option>
              </select>
            </label>
            <label>
              <span>Amount (HKD)</span>
              <input name="amount" inputMode="decimal" placeholder="80.00" required />
            </label>
            <label>
              <span>Note</span>
              <textarea
                name="description"
                placeholder="Optional note, for example long-term savings"
              />
            </label>
            <SubmitButton className="primary-button">Move money</SubmitButton>
          </form>
        </article>

        <article className="panel">
          <h2>Daily compounding</h2>
          <p>
            Savings interest uses the APR your parents set in the admin portal. Each day,
            the app looks at your opening savings balance for that Hong Kong date and adds a
            small interest credit to your ledger.
          </p>
          <p className="small-note">
            Current rate: {toNumber(currentRate?.apr_percent ?? 0).toFixed(2)}% APR. Last
            credited date: {formatBusinessDate(lastInterestDate)}.
          </p>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 22 }}>
        <h2>Savings history</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {savingsEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.created_at)}</td>
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
