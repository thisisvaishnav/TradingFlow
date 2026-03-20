import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tradingFlowApiClient } from "@/lib/api-client";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthMode = "signin" | "signup";

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTarget = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/dashboard";
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await tradingFlowApiClient.signup({ username: username.trim(), password });
      } else {
        await tradingFlowApiClient.signin({ username: username.trim(), password });
      }
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Left panel: brand ── */}
      <div
        className="hidden w-1/2 flex-col justify-between p-8 md:flex"
        style={{
          background: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
            var(--bg-surface)
          `,
          backgroundSize: "40px 40px",
          borderRight: "1px solid var(--border)",
        }}
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
        <div>
          <h2 className="font-heading text-3xl" style={{ color: "var(--text-primary)" }}>
            Build workflows
            <br />
            that trade.
          </h2>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Visual automation for crypto. Wire triggers to actions, deploy, and track.
          </p>
        </div>
        <p className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
          TradingFlow · v1.0
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex w-full flex-col justify-center p-6 md:w-1/2 md:p-12">
        <div className="mb-4 flex justify-end md:hidden">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Mode toggle */}
          <div className="flex" style={{ border: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{
                background: mode === "signin" ? "var(--bg-card)" : "transparent",
                color: mode === "signin" ? "var(--text-primary)" : "var(--text-muted)",
                borderRight: "1px solid var(--border)",
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{
                background: mode === "signup" ? "var(--bg-card)" : "transparent",
                color: mode === "signup" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Sign up
            </button>
          </div>

          <div>
            <h1 className="font-heading text-lg" style={{ color: "var(--text-primary)" }}>
              {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
            </h1>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="auth-username">Username</Label>
              <Input
                id="auth-username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {errorMessage && (
              <div
                className="p-2.5 text-xs"
                style={{
                  background: "var(--destructive-muted)",
                  border: "1px solid var(--destructive)",
                  color: "var(--destructive)",
                }}
              >
                {errorMessage}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
