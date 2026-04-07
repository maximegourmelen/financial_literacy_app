import { AppShell } from "@/components/app-shell";
import { StatusBanner } from "@/components/status-banner";
import { SummaryCard } from "@/components/summary-card";
import { SubmitButton } from "@/components/submit-button";
import { getBalancesForUser, getLedgerEntriesForUser } from "@/lib/accounts";
import { requireSession } from "@/lib/auth";
import { ensureSavingsInterestUpToDate } from "@/lib/interest";
import { formatMoney, toNumber } from "@/lib/money";
import { formatDateTime } from "@/lib/time";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckingPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("child");
  await ensureSavingsInterestUpToDate();

  const [balances, entries] = await Promise.all([
    getBalancesForUser(session.userId),
    getLedgerEntriesForUser(session.userId, 40)
  ]);

  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : null;
  const error = typeof params.error === "string" ? params.error : null;
  const checkingEntries = entries.filter((entry) => entry.account_type === "checking");

  return (
    <AppShell
      role="child"
      currentPath="/checking"
      title="Checking account"
      subtitle="This is the family cash bucket for deposits, withdrawals, and funding other accounts."
      displayName={session.displayName}
    >
      <StatusBanner message={message} error={error} />

      <section className="dashboard-grid">
        <SummaryCard
          label="Checking balance"
          value={formatMoney(balances.checking)}
          detail="0.00% interest"
        />
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Deposit or withdraw cash</h2>
          <form action="/api/transactions/cash" method="post">
            <input type="hidden" name="returnTo" value="/checking" />
            <label>
              <span>Action</span>
              <select name="direction" defaultValue="deposit">
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdraw</option>
              </select>
            </label>
            <label>
              <span>Amount (HKD)</span>
              <input name="amount" inputMode="decimal" placeholder="100.00" required />
            </label>
            <label>
              <span>Note</span>
              <textarea name="description" placeholder="Optional note for your parents" />
            </label>
            <SubmitButton className="primary-button">Save cash movement</SubmitButton>
          </form>
        </article>

        <article className="panel">
          <h2>Move money elsewhere</h2>
          <form action="/api/transactions/transfer" method="post">
            <input type="hidden" name="returnTo" value="/checking" />
            <input type="hidden" name="fromAccount" value="checking" />
            <label>
              <span>Transfer to</span>
              <select name="toAccount" defaultValue="savings">
                <option value="savings">Savings</option>
                <option value="investment_cash">Investments cash</option>
              </select>
            </label>
            <label>
              <span>Amount (HKD)</span>
              <input name="amount" inputMode="decimal" placeholder="50.00" required />
            </label>
            <label>
              <span>Reason</span>
              <textarea
                name="description"
                placeholder="Optional note, such as saving for later or funding an investment"
              />
            </label>
            <SubmitButton className="secondary-button">Transfer money</SubmitButton>
          </form>
        </article>
      </section>

      <section className="table-card" style={{ marginTop: 22 }}>
        <h2>Checking history</h2>
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
              {checkingEntries.map((entry) => (
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
