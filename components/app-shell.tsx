import Link from "next/link";

import { APP_NAME } from "@/lib/config";
import { UserRole } from "@/lib/types";

type AppShellProps = {
  role: UserRole;
  currentPath: string;
  title: string;
  subtitle: string;
  displayName: string;
  children: React.ReactNode;
};

const CHILD_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/checking", label: "Checking" },
  { href: "/savings", label: "Savings" },
  { href: "/investments", label: "Investments" },
  { href: "/history", label: "History" }
 ] as const;

const ADMIN_LINKS = [{ href: "/admin", label: "Admin Portal" }] as const;

export function AppShell({
  role,
  currentPath,
  title,
  subtitle,
  displayName,
  children
}: AppShellProps) {
  const links = role === "admin" ? ADMIN_LINKS : CHILD_LINKS;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href={role === "admin" ? "/admin" : "/dashboard"}>
          <span className="brand-badge">HKD</span>
          <div>
            <strong>{APP_NAME}</strong>
            <p>{role === "admin" ? "Parent controls" : "Family money practice"}</p>
          </div>
        </Link>

        <nav className="nav-list">
          {links.map((link) => (
            <Link
              key={link.href}
              className={currentPath === link.href ? "nav-link active" : "nav-link"}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Signed in as</p>
          <strong>{displayName}</strong>
          <form action="/api/auth/logout" method="post">
            <button className="ghost-button" type="submit">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">{role === "admin" ? "Admin portal" : "Sibling dashboard"}</p>
            <h1>{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
