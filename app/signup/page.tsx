import Link from "next/link";

import { StatusBanner } from "@/components/status-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfLoggedIn } from "@/lib/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({
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
        <p className="eyebrow">Sibling signup</p>
        <h1>Create your account.</h1>
        <p>Pick your own username and password. The app will allow up to two sibling accounts.</p>

        <StatusBanner error={error} message={message} />

        <form action="/api/auth/signup" method="post">
          <input type="hidden" name="expectedRole" value="child" />
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
          <SubmitButton className="primary-button">Create sibling account</SubmitButton>
        </form>

        <div className="auth-actions">
          <Link className="ghost-button" href="/login">
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
