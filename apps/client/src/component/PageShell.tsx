import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

type PageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

const navItems = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/create-workflow", label: "Builder" },
];

export const PageShell = ({ title, description, children, className }: PageShellProps) => {
  const location = useLocation();

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 flex h-12 items-center justify-between px-4"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Workflow size={14} />
          </div>
          <span className="font-heading text-sm" style={{ color: "var(--text-primary)" }}>
            TradingFlow
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-0 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        {/* Page header */}
        <div
          className="mb-4 p-4"
          style={{
            background: "var(--bg-surface)",
            borderLeft: "3px solid var(--accent)",
            borderTop: "1px solid var(--border)",
            borderRight: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h1 className="font-heading text-xl" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>

        {/* Page content */}
        <div
          className={className}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="p-4 md:p-5">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
};
