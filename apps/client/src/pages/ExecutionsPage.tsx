import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/component/AppSidebar";
import { tradingFlowApiClient, type WorkflowExecutionResponse } from "@/lib/api-client";

export const ExecutionsPage = () => {
  const [allExecutions, setAllExecutions] = useState<(WorkflowExecutionResponse & { workflowId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await tradingFlowApiClient.listWorkflows();

        // Fetch executions for each workflow
        const execResults = await Promise.allSettled(
          response.workflows.map(async (wf) => {
            const res = await tradingFlowApiClient.getWorkflowExecution(wf._id);
            return res.executions.map((e) => ({ ...e, workflowId: wf._id }));
          })
        );

        const execs = execResults
          .filter((r): r is PromiseFulfilledResult<(WorkflowExecutionResponse & { workflowId: string })[]> => r.status === "fulfilled")
          .flatMap((r) => r.value)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        setAllExecutions(execs);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="app-layout" style={{ height: "100vh", overflow: "hidden" }}>
      <AppSidebar />
      <div className="app-layout__content" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* ── Header ── */}
        <div className="workflow-topbar">
          <div className="workflow-topbar__left">
            <div className="workflow-topbar__info">
              <span className="workflow-topbar__name">Execution History</span>
              <span className="workflow-topbar__meta">
                ALL WORKFLOWS // {allExecutions.length} TOTAL
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", height: 64 }} />
              ))}
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                fontSize: 12,
                background: "var(--destructive-muted)",
                border: "1px solid var(--destructive)",
                color: "var(--destructive)",
              }}
            >
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && allExecutions.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No execution history yet.</p>
            </div>
          )}

          {!isLoading && allExecutions.length > 0 && (
            <div style={{ border: "1px solid var(--border)" }}>
              {/* Header */}
              <div
                className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] items-center gap-4 px-4 py-2"
                style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Workflow</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Node</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Start</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>End</span>
              </div>

              {/* Rows */}
              {allExecutions.map((exec) => (
                <div
                  key={exec._id}
                  className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`status-dot status-dot--${exec.status.toLowerCase()}`} />
                    <span className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>
                      {exec.status}
                    </span>
                  </div>
                  <Link
                    to={`/workflows/${exec.workflowId}`}
                    className="font-data text-xs"
                    style={{ color: "var(--accent)", textDecoration: "none" }}
                  >
                    {exec.workflowId.slice(-8)}
                  </Link>
                  <span className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
                    {exec.nodeName ?? "Unknown Node"}
                  </span>
                  <span className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>
                    {new Date(exec.startTime).toLocaleString()}
                  </span>
                  <span className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>
                    {exec.endTime ? new Date(exec.endTime).toLocaleString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
