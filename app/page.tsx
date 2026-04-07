import Link from "next/link";

import { APP_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-panel">
          <p className="eyebrow">Family money practice</p>
          <h1>Learn saving, interest, and investing with real choices.</h1>
          <p className="hero-copy">
            {APP_NAME} gives each sibling a simple HKD account with checking, savings,
            and investments. Deposits and withdrawals track the family cash ledger, while
            savings interest and market prices help turn the app into a hands-on learning tool.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" href="/login">
              Sibling login
            </Link>
            <Link className="secondary-button" href="/admin/login">
              Parent admin
            </Link>
          </div>
        </div>

        <div className="hero-grid">
          <article className="hero-metric panel">
            <p className="eyebrow">Three buckets</p>
            <strong>Checking</strong>
            <p>Cash balance for deposits and withdrawals.</p>
          </article>
          <article className="hero-metric panel">
            <p className="eyebrow">Earn daily</p>
            <strong>Savings</strong>
            <p>Daily compounded interest in Hong Kong dollars.</p>
          </article>
          <article className="hero-metric panel">
            <p className="eyebrow">Practice investing</p>
            <strong>Investments</strong>
            <p>Buy and sell a starter list of ETFs, stocks, and crypto.</p>
          </article>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <h2>Cash discipline</h2>
          <p>
            Kids can log deposits and withdrawals instantly, while parents still have a
            clean audit trail for reconciling real-world cash.
          </p>
        </article>
        <article className="panel">
          <h2>Visible compounding</h2>
          <p>
            Savings interest is credited daily, so the lesson about time and returns
            shows up directly in the balance.
          </p>
        </article>
        <article className="panel">
          <h2>Simple investing</h2>
          <p>
            Trade by HKD amount or by quantity, then watch positions rise and fall like
            a lightweight brokerage account.
          </p>
        </article>
      </section>
    </div>
  );
}
