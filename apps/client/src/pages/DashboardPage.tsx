import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Zap, Trash2 } from "lucide-react";
import { AppSidebar } from "@/component/AppSidebar";
import { tradingFlowApiClient, type WorkflowResponse } from "@/lib/api-client";

/** Derive a human-readable name from workflow nodes or DB name */
const getWorkflowName = (workflow: WorkflowResponse, index: number): string => {
  if (workflow.name && workflow.name !== "Untitled Workflow") return workflow.name;
  const triggerNode = workflow.nodes.find((n) => n.data.kind === "TRIGGER");
  const actionNode = workflow.nodes.find((n) => n.data.kind === "ACTION");
  const meta = triggerNode?.data.metadata as Record<string, unknown> | undefined;
  const actionMeta = actionNode?.data.metadata as Record<string, unknown> | undefined;

  if (meta && "asset" in meta && "price" in meta) {
    const symbol = String(meta.asset ?? "").toUpperCase();
    const side = actionMeta && "type" in actionMeta ? String(actionMeta.type) : "";
    if (side === "SHORT") return `${symbol} Short Reversal`;
    return `${symbol} Price Breakout`;
  }
  if (meta && "time" in meta) {
    const actionSymbol = actionMeta && "symbol" in actionMeta ? String(actionMeta.symbol).toUpperCase() : "";
    return `${actionSymbol || "BTC"} DCA Timer`;
  }
  return `Workflow ${index + 1}`;
};

/** Get status from the API response */
const getStatus = (workflow: WorkflowResponse): "active" | "inactive" | "draft" => {
  if (workflow.isActive) return "active";
  if (workflow.status === "INACTIVE") return "inactive";
  return "draft";
};

/** Get a mini-summary for preview boxes */
const getNodePreview = (node: WorkflowResponse["nodes"][number]): string => {
  const meta = node.data.metadata as Record<string, unknown>;
  if (node.data.kind === "TRIGGER") {
    if ("asset" in meta && "price" in meta) return `${meta.asset} > $${meta.price}`;
    if ("time" in meta) return `Every ${meta.time}s`;
    return "Trigger";
  }
  if ("type" in meta && "symbol" in meta) return `${meta.type} ${meta.symbol}`;
  return "Action";
};

/** Pre-built templates */
const TEMPLATES: Array<{
  name: string;
  exchange: string;
  description: string;
  payload: {
    name: string;
    nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: { kind: "action" | "trigger"; metadata: Record<string, unknown> } }>;
    edges: Array<{ source: string; target: string }>;
  };
}> = [
  {
    name: "SOL Price Breakout",
    exchange: "Hyperliquid",
    description: "Trigger when SOL > $180, go LONG on Hyperliquid",
    payload: {
      name: "SOL Price Breakout",
      nodes: [
        { id: "t1", type: "Price-trigger", position: { x: 100, y: 150 }, data: { kind: "trigger", metadata: { asset: "SOL", price: 180 } } },
        { id: "a1", type: "Hyperliquid", position: { x: 400, y: 150 }, data: { kind: "action", metadata: { type: "LONG", qty: 1, symbol: "SOL" } } },
      ],
      edges: [{ source: "t1", target: "a1" }],
    },
  },
  {
    name: "BTC DCA Timer",
    exchange: "Backpack",
    description: "Buy BTC every hour on Backpack",
    payload: {
      name: "BTC DCA Timer",
      nodes: [
        { id: "t1", type: "timer", position: { x: 100, y: 150 }, data: { kind: "trigger", metadata: { time: 3600 } } },
        { id: "a1", type: "Backpack", position: { x: 400, y: 150 }, data: { kind: "action", metadata: { type: "LONG", qty: 0.001, symbol: "BTC" } } },
      ],
      edges: [{ source: "t1", target: "a1" }],
    },
  },
  {
    name: "ETH Cascade",
    exchange: "Lighter",
    description: "Trigger when ETH > $4000, go LONG on Lighter",
    payload: {
      name: "ETH Cascade",
      nodes: [
        { id: "t1", type: "Price-trigger", position: { x: 100, y: 150 }, data: { kind: "trigger", metadata: { asset: "ETH", price: 4000 } } },
        { id: "a1", type: "Lighter", position: { x: 400, y: 150 }, data: { kind: "action", metadata: { type: "LONG", qty: 0.5, symbol: "ETH" } } },
      ],
      edges: [{ source: "t1", target: "a1" }],
    },
  },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await tradingFlowApiClient.listWorkflows();
        setWorkflows(response.workflows);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load workflows.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleToggle = async (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTogglingIds((prev) => new Set(prev).add(workflowId));
    try {
      const { workflow: updated } = await tradingFlowApiClient.toggleWorkflow(workflowId);
      setWorkflows((prev) => prev.map((w) => (w._id === workflowId ? updated : w)));
    } catch {
      // Silently fail
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(workflowId);
        return next;
      });
    }
  };

  const handleUseTemplate = (template: (typeof TEMPLATES)[number]) => {
    navigate("/create-workflow", { state: { template: template.payload } });
  };

  const handleDelete = async (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this workflow? This cannot be undone.")) return;
    try {
      await tradingFlowApiClient.deleteWorkflow(workflowId);
      setWorkflows((prev) => prev.filter((w) => w._id !== workflowId));
    } catch {
      setErrorMessage("Failed to delete workflow.");
    }
  };

  const activeCount = workflows.filter((w) => w.isActive).length;

  return (
    <div className="app-layout">
      <AppSidebar />
      <div className="app-layout__content">
        {/* ── System Status Banner ── */}
        <div className="status-banner">
          <div className="status-banner__left">
            <div className="status-banner__label">System Status</div>
            <h1 className="status-banner__heading">SYSTEM.READY // STANDBY FOR TRIGGER</h1>
            <p className="status-banner__subtitle">
              Automated execution logic for Hyperliquid, Backpack, and Lighter.
            </p>
          </div>
          <div className="status-banner__stats">
            <div className="status-banner__stat">
              <div className="status-banner__stat-label">Active Workflows</div>
              <div className="status-banner__stat-value">{activeCount}</div>
            </div>
            <div className="status-banner__stat">
              <div className="status-banner__stat-label">Total Schematics</div>
              <div className="status-banner__stat-value">{workflows.length}</div>
            </div>
          </div>
        </div>

        {/* ── Schematics Header ── */}
        <div className="schematics-header">
          <span className="schematics-header__title">Workflow Schematics</span>
          <Link to="/create-workflow" className="btn-commit" style={{ textDecoration: "none" }}>
            <Plus size={14} />
            New Schematic
          </Link>
        </div>

        {/* ── Error ── */}
        {errorMessage && (
          <div
            className="text-xs"
            style={{
              margin: "0 24px 16px",
              padding: "10px 14px",
              background: "var(--destructive-muted)",
              border: "1px solid var(--destructive)",
              color: "var(--destructive)",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="workflow-cards">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  height: 180,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !errorMessage && workflows.length === 0 && (
          <div
            style={{
              margin: "0 24px",
              padding: "40px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>
              No workflow schematics yet. Create your first one or use a template below.
            </p>
            <Link to="/create-workflow" className="btn-commit" style={{ textDecoration: "none" }}>
              <Plus size={14} />
              New Schematic
            </Link>
          </div>
        )}

        {/* ── Workflow Cards ── */}
        {!isLoading && workflows.length > 0 && (
          <div className="workflow-cards">
            {workflows.map((workflow, index) => {
              const name = getWorkflowName(workflow, index);
              const status = getStatus(workflow);
              const triggerNodes = workflow.nodes.filter((n) => n.data.kind === "TRIGGER");
              const actionNodes = workflow.nodes.filter((n) => n.data.kind === "ACTION");
              const previewNodes = [...triggerNodes.slice(0, 2), ...actionNodes.slice(0, 2)];
              const isToggling = togglingIds.has(workflow._id);

              return (
                <Link
                  key={workflow._id}
                  to={`/workflows/${workflow._id}`}
                  className="workflow-card"
                >
                  {/* Header */}
                  <div className="workflow-card__header">
                    <span className="workflow-card__name">{name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`workflow-card__badge workflow-card__badge--${status}`}>
                        <span className="workflow-card__badge-dot" />
                        {status}
                      </span>
                      {/* Toggle switch with label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          className={`toggle-switch ${workflow.isActive ? "toggle-switch--active" : ""}`}
                          onClick={(e) => handleToggle(e, workflow._id)}
                          disabled={isToggling}
                          title={workflow.isActive ? "Stop execution" : "Start execution"}
                        >
                          <div className="toggle-switch__knob" />
                        </button>
                        <span style={{ fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', color: workflow.isActive ? "var(--accent)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {workflow.isActive ? "Running" : "Start"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini node preview */}
                  <div className="workflow-card__preview">
                    {previewNodes.map((node, ni) => (
                      <span
                        key={ni}
                        className={`workflow-card__mini-node ${node.data.kind === "TRIGGER" ? "workflow-card__mini-node--trigger" : ""}`}
                      >
                        {getNodePreview(node)}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="workflow-card__footer">
                    <span className="workflow-card__meta">
                      {workflow.nodes.length} Nodes
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, workflow._id)}
                      title="Delete workflow"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        padding: "3px 8px",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 9,
                        fontFamily: '"IBM Plex Mono", monospace',
                        textTransform: "uppercase" as const,
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.borderColor = "var(--destructive)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Templates Section ── */}
        <div className="schematics-header" style={{ marginTop: 8 }}>
          <span className="schematics-header__title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={14} style={{ color: "var(--accent)" }} />
            Ready-Made Templates
          </span>
        </div>
        <div className="workflow-cards">
          {TEMPLATES.map((template) => (
            <button
              key={template.name}
              className="workflow-card"
              onClick={() => handleUseTemplate(template)}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <div className="workflow-card__header">
                <span className="workflow-card__name">{template.name}</span>
                <span className="workflow-card__badge workflow-card__badge--draft">
                  <span className="workflow-card__badge-dot" />
                  {template.exchange}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 12px", lineHeight: 1.5 }}>
                {template.description}
              </p>
              <div className="workflow-card__preview">
                {template.payload.nodes.map((node, ni) => (
                  <span
                    key={ni}
                    className={`workflow-card__mini-node ${node.data.kind === "trigger" ? "workflow-card__mini-node--trigger" : ""}`}
                  >
                    {node.data.kind === "trigger" ? (
                      node.data.metadata.asset
                        ? `${node.data.metadata.asset} > $${node.data.metadata.price}`
                        : `Every ${node.data.metadata.time}s`
                    ) : (
                      `${node.data.metadata.type} ${node.data.metadata.symbol}`
                    )}
                  </span>
                ))}
              </div>
              <div className="workflow-card__footer">
                <span className="workflow-card__meta" style={{ color: "var(--accent)" }}>
                  Use Template →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
