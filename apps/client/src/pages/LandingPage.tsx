import { Link } from "react-router-dom";
import { ArrowRight, Zap, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Workflow } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Price & Timer Triggers",
    description: "Set conditions that fire when price crosses thresholds or on interval schedules.",
  },
  {
    icon: BarChart3,
    title: "Multi-Exchange Execution",
    description: "Route orders to Hyperliquid, Backpack, or Lighter with one workflow.",
  },
  {
    icon: Shield,
    title: "Execution Tracking",
    description: "Full audit trail — every run logged with status, timing, and error output.",
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Minimal nav ── */}
      <header
        className="flex h-12 items-center justify-between px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/auth"
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Link>
          <Button size="sm" asChild>
            <Link to="/create-workflow">Launch App</Link>
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative px-6 py-20 md:py-32"
        style={{
          borderBottom: "1px solid var(--border)",
          background: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
            var(--bg-base)
          `,
          backgroundSize: "60px 60px",
        }}
      >
        <div className="mx-auto max-w-3xl">
          <div
            className="mb-4 inline-block px-3 py-1 text-xs font-medium uppercase tracking-widest font-data"
            style={{
              border: "1px solid var(--accent)",
              color: "var(--accent)",
            }}
          >
            Workflow Automation for Crypto
          </div>

          <h1
            className="font-heading text-4xl md:text-6xl leading-[1.05]"
            style={{ color: "var(--text-primary)" }}
          >
            Build trading
            <br />
            workflows that
            <br />
            <span style={{ color: "var(--accent)" }}>execute.</span>
          </h1>

          <p
            className="mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Wire trigger conditions to exchange actions. Deploy once,
            let the system run. Every execution tracked and auditable.
          </p>

          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-3xl gap-0 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="p-5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                marginLeft: i > 0 ? "-1px" : undefined,
              }}
            >
              <Icon
                className="mb-3 size-5"
                style={{ color: "var(--accent)" }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
          TradingFlow · Crypto workflow automation
        </p>
      </footer>
    </div>
  );
};
