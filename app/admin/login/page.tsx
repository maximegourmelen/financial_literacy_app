import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfLoggedIn } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await redirectIfLoggedIn("admin");
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Parent admin</p>
        <h1>Manage family accounts.</h1>
        <p>Use the admin login to set savings rates and review every sibling balance.</p>

        <StatusBanner error={error} message={message} />

        <form action="/api/auth/login" method="post">
          <input type="hidden" name="expectedRole" value="admin" />
          <label>
            <span>Username</span>
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <SubmitButton className="primary-button">Log in as admin</SubmitButton>
        </form>

        <div className="auth-actions">
          <Link className="ghost-button" href="/login">
            Back to sibling login
          </Link>
        </div>
      </div>
    </div>
  );
}
