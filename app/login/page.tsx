import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfLoggedIn } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await redirectIfLoggedIn("child");
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Sibling login</p>
        <h1>Welcome back.</h1>
        <p>Sign in with your family username and password to manage your HKD money.</p>

        <StatusBanner error={error} message={message} />

        <form action="/api/auth/login" method="post">
          <input type="hidden" name="expectedRole" value="child" />
          <label>
            <span>Username</span>
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <SubmitButton className="primary-button">Log in</SubmitButton>
        </form>

        <div className="auth-actions">
          <Link className="ghost-button" href="/admin/login">
            Parent admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
