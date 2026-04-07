import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfLoggedIn } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminSetupPage({
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
        <p className="eyebrow">Parent setup</p>
        <h1>Create the admin account.</h1>
        <p>Use the private setup code from `ADMIN_SETUP_CODE` the first time you create the parent login.</p>

        <StatusBanner error={error} message={message} />

        <form action="/api/auth/signup" method="post">
          <input type="hidden" name="expectedRole" value="admin" />
          <label>
            <span>Display name</span>
            <input name="displayName" autoComplete="name" required />
          </label>
          <label>
            <span>Username</span>
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" autoComplete="new-password" required />
          </label>
          <label>
            <span>Admin setup code</span>
            <input name="setupCode" type="password" required />
          </label>
          <SubmitButton className="primary-button">Create admin account</SubmitButton>
        </form>

        <div className="auth-actions">
          <Link className="ghost-button" href="/admin/login">
            Back to admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
