import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { AppSidebar } from "@/component/AppSidebar";
import { tradingFlowApiClient, type WorkflowExecutionResponse } from "@/lib/api-client";

export const WorkflowExecutionsPage = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<WorkflowExecutionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!workflowId) { setErrorMessage("Workflow id is missing."); setIsLoading(false); return; }
      try {
        setIsLoading(true);
        const response = await tradingFlowApiClient.getWorkflowExecution(workflowId);
        setExecutions(response.executions);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load executions.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [workflowId]);

  return (
    <div className="app-layout" style={{ height: "100vh", overflow: "hidden" }}>
      <AppSidebar />
      <div className="app-layout__content" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* ── Top Bar ── */}
        <div className="workflow-topbar">
          <div className="workflow-topbar__left">
            <button className="workflow-topbar__back" onClick={() => navigate(`/workflows/${workflowId}`)}>
              <ArrowLeft size={16} />
            </button>
            <div className="workflow-topbar__info">
              <span className="workflow-topbar__name">Execution History</span>
              <span className="workflow-topbar__meta">
                WORKFLOW // ID: {workflowId ? workflowId.slice(-6) : "—"}
              </span>
            </div>
          </div>
          <div className="workflow-topbar__right">
            {workflowId && (
              <Link
                to={`/workflows/${workflowId}`}
                className="btn-ghost"
                style={{ textDecoration: "none" }}
              >
                <Eye size={14} /> Inspect Workflow
              </Link>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", height: 80 }} />
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

          {!isLoading && !errorMessage && executions.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No execution history for this workflow.</p>
            </div>
          )}

          {!isLoading && executions.length > 0 && (
            <div style={{ border: "1px solid var(--border)" }}>
              {/* Header */}
              <div
                className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 px-4 py-2"
                style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Node</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Start</span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>End</span>
              </div>

              {/* Rows */}
              {executions.map((exec) => (
                <div
                  key={exec._id}
                  className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`status-dot status-dot--${exec.status.toLowerCase()}`} />
                    <span className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>
                      {exec.status}
                    </span>
                  </div>
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
