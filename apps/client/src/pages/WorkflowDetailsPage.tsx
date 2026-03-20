import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Save, Play, Eye, Clock, TrendingUp, ArrowLeftRight, Zap, Mail, Send } from "lucide-react";
import { tradingFlowApiClient, type WorkflowResponse } from "@/lib/api-client";
import { PriceTriggerNode } from "@/nodes/triggers/PriceTrigger";
import { TimerNode } from "@/nodes/triggers/Timer";
import { Hyperliquid } from "@/nodes/action/Hyperliquid";
import { Backpack } from "@/nodes/action/Backpack";
import { Lighter } from "@/nodes/action/Lighter";
import { EmailNode } from "@/nodes/notification/EmailNode";
import { TelegramNode } from "@/nodes/notification/TelegramNode";
import { AppSidebar } from "@/component/AppSidebar";
import { TriggerSheet } from "@/component/TriggerSheet";
import { ActionSheet } from "@/component/ActionSheet";
import { NotificationSheet } from "@/component/NotificationSheet";
import type { NodeKind, NodeMetadata } from "@/component/CreateWorkflow";

const nodeTypes = {
  "Price-trigger": PriceTriggerNode,
  timer: TimerNode,
  Hyperliquid: Hyperliquid,
  Backpack: Backpack,
  Lighter: Lighter,
  Email: EmailNode,
  Telegram: TelegramNode,
};

const TRIGGER_PALETTE = [
  { id: "Price-trigger" as NodeKind, label: "Price Trigger", icon: TrendingUp },
  { id: "timer" as NodeKind, label: "Timer", icon: Clock },
];

const ACTION_PALETTE = [
  { id: "Hyperliquid" as NodeKind, label: "Hyperliquid" },
  { id: "Backpack" as NodeKind, label: "Backpack" },
  { id: "Lighter" as NodeKind, label: "Lighter" },
];

const NOTIFICATION_PALETTE = [
  { id: "Email" as NodeKind, label: "Email Alert", icon: Mail },
  { id: "Telegram" as NodeKind, label: "Telegram Alert", icon: Send },
];

const getNodeSummary = (node: any): string => {
  const meta = node.data.metadata;
  if (node.data.kind === "TRIGGER" || node.data.kind === "trigger") {
    if (meta?.asset && meta?.price) return `${meta.asset} > $${meta.price}`;
    if (meta?.time) return `Every ${meta.time}s`;
    return "Trigger";
  }
  if (meta?.type && meta?.symbol) return `${meta.type} ${meta.symbol}`;
  if ((node.data.kind || "").toUpperCase() === "NOTIFICATION") {
    if (node.type === "Email") return meta?.to || "Email";
    if (node.type === "Telegram") return meta?.chatId || "Telegram";
    return "Notification";
  }
  return "Action";
};

const getNodeTypeLabel = (node: any): string => {
  const kind = (node.data.kind || "").toUpperCase();
  if (kind === "TRIGGER") {
    if (node.type === "Price-trigger") return "TRIGGER // PRICE";
    if (node.type === "timer") return "TRIGGER // TIMER";
    return "TRIGGER";
  }
  const kindStr = (node.data.kind || "").toUpperCase();
  if (kindStr === "NOTIFICATION") {
    return `NOTIFY // ${node.type?.toUpperCase() ?? "NOTIFY"}`;
  }
  return `ACTION // ${node.type?.toUpperCase() ?? "ACTION"}`;
};

type ToastState = { message: string; tone: "error" | "success" } | null;

export const WorkflowDetailsPage = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastState, setToastState] = useState<ToastState>(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [showPalette, setShowPalette] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sheets
  const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [pendingTriggerType, setPendingTriggerType] = useState<string | undefined>();
  const [pendingActionType, setPendingActionType] = useState<string | undefined>();
  const [pendingNotificationType, setPendingNotificationType] = useState<string | undefined>();
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editMetadata, setEditMetadata] = useState<NodeMetadata | undefined>();

  const showToast = (message: string, tone: "error" | "success" = "error") => {
    setToastState({ message, tone });
    window.setTimeout(() => setToastState(null), 3200);
  };

  useEffect(() => {
    const load = async () => {
      if (!workflowId) return;
      try {
        setIsLoading(true);
        const data = await tradingFlowApiClient.getWorkflow(workflowId);
        setWorkflow(data);
        setWorkflowName(data.name || "Untitled Workflow");
        setNodes(data.nodes.map((n) => ({ ...n, position: n.position ?? { x: 0, y: 0 } })));
        setEdges(data.edges);
      } catch {
        showToast("Failed to load workflow");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [workflowId]);

  const onNodesChange = useCallback(
    (changes: any) => { setNodes((s: any) => applyNodeChanges(changes, s)); setHasChanges(true); }, [],
  );
  const onEdgesChange = useCallback(
    (changes: any) => { setEdges((s: any) => applyEdgeChanges(changes, s)); setHasChanges(true); }, [],
  );
  const onConnect = useCallback(
    (params: any) => { setEdges((s: any) => addEdge(params, s)); setHasChanges(true); }, [],
  );

  // Node click for editing
  const onNodeClick = useCallback((_: any, node: any) => {
    setEditingNodeId(node.id);
    setEditMetadata(node.data.metadata);
    const kind = (node.data.kind || "").toUpperCase();
    if (kind === "TRIGGER") {
      setPendingTriggerType(node.type);
      setIsTriggerSheetOpen(true);
    } else if (kind === "NOTIFICATION") {
      setPendingNotificationType(node.type);
      setIsNotificationSheetOpen(true);
    } else {
      setPendingActionType(node.type);
      setIsActionSheetOpen(true);
    }
  }, []);

  const handleTriggerSelect = (kind: NodeKind, metadata: NodeMetadata) => {
    if (editingNodeId) {
      setNodes((prev) => prev.map((n: any) =>
        n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
      ));
      setEditingNodeId(null);
      setEditMetadata(undefined);
    } else {
      setNodes((prev) => [...prev, {
        id: Math.random().toString(), type: kind,
        position: { x: 120 + prev.length * 40, y: 100 + prev.length * 30 },
        data: { type: kind, kind: "TRIGGER", metadata },
      }]);
    }
    setHasChanges(true);
    setIsTriggerSheetOpen(false);
    setPendingTriggerType(undefined);
  };

  const handleActionSelect = (kind: NodeKind, metadata: NodeMetadata) => {
    if (editingNodeId) {
      setNodes((prev) => prev.map((n: any) =>
        n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
      ));
      setEditingNodeId(null);
      setEditMetadata(undefined);
    } else {
      setNodes((prev) => [...prev, {
        id: Math.random().toString(), type: kind,
        position: { x: 400 + prev.length * 40, y: 100 + prev.length * 30 },
        data: { type: kind, kind: "ACTION", metadata },
      }]);
    }
    setHasChanges(true);
    setIsActionSheetOpen(false);
    setPendingActionType(undefined);
  };

  const handleNotificationSelect = (kind: NodeKind, metadata: NodeMetadata) => {
    if (editingNodeId) {
      setNodes((prev) => prev.map((n: any) =>
        n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
      ));
      setEditingNodeId(null);
      setEditMetadata(undefined);
    } else {
      setNodes((prev) => [...prev, {
        id: Math.random().toString(), type: kind,
        position: { x: 600 + prev.length * 40, y: 100 + prev.length * 30 },
        data: { type: kind, kind: "NOTIFICATION", metadata },
      }]);
    }
    setHasChanges(true);
    setIsNotificationSheetOpen(false);
    setPendingNotificationType(undefined);
  };

  const handleSave = async () => {
    if (!workflowId || !workflow) return;
    try {
      setIsSaving(true);
      const { workflow: updated } = await tradingFlowApiClient.updateWorkflow(workflowId, {
        name: workflowName,
        nodes: nodes.map((n: any) => ({
          id: n.id, type: n.type,
          position: n.position ?? { x: 0, y: 0 },
          data: {
            kind: (n.data.kind || "action").toLowerCase() as "action" | "trigger",
            metadata: n.data.metadata as Record<string, unknown>,
          },
        })),
        edges: edges.map((e: any) => ({ id: e.id || `e-${e.source}-${e.target}`, source: e.source, target: e.target })),
      });
      setWorkflow(updated);
      setHasChanges(false);
      showToast("Workflow saved", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!workflowId) return;
    try {
      const { workflow: updated } = await tradingFlowApiClient.toggleWorkflow(workflowId);
      setWorkflow(updated);
      showToast(updated.isActive ? "Execution started" : "Execution stopped", "success");
    } catch {
      showToast("Toggle failed");
    }
  };

  const handleSaveAndCommit = async () => {
    if (!workflowId || !workflow) return;
    try {
      setIsSaving(true);
      // Save first
      const { workflow: saved } = await tradingFlowApiClient.updateWorkflow(workflowId, {
        name: workflowName,
        status: "ACTIVE",
        isActive: true,
        nodes: nodes.map((n: any) => ({
          id: n.id, type: n.type,
          position: n.position ?? { x: 0, y: 0 },
          data: {
            kind: (n.data.kind || "action").toLowerCase() as "action" | "trigger",
            metadata: n.data.metadata as Record<string, unknown>,
          },
        })),
        edges: edges.map((e: any) => ({ id: e.id || `e-${e.source}-${e.target}`, source: e.source, target: e.target })),
      });
      setWorkflow(saved);
      setHasChanges(false);
      showToast("Workflow saved & execution started", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-layout" style={{ height: "100vh" }}>
        <AppSidebar />
        <div className="app-layout__content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Loading workflow…</span>
        </div>
      </div>
    );
  }

  const status = workflow?.isActive ? "ACTIVE" : (workflow?.status || "DRAFT");

  return (
    <div className="app-layout" style={{ height: "100vh", overflow: "hidden" }}>
      <AppSidebar />
      <div className="app-layout__content" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* ── Top Bar ── */}
        <div className="workflow-topbar">
          <div className="workflow-topbar__left">
            <button className="workflow-topbar__back" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} />
            </button>
            <div className="workflow-topbar__info">
              <input
                className="workflow-topbar__name"
                value={workflowName}
                onChange={(e) => { setWorkflowName(e.target.value); setHasChanges(true); }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: "auto",
                  minWidth: 120,
                  padding: 0,
                }}
              />
              <span className="workflow-topbar__meta">
                {status} // ID: {workflowId?.slice(-6)}
                {hasChanges && <span style={{ color: "var(--accent)", marginLeft: 8 }}>• unsaved</span>}
              </span>
            </div>
          </div>
          <div className="workflow-topbar__right">
            {/* Toggle with label */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 8 }}>
              <button
                className={`toggle-switch ${workflow?.isActive ? "toggle-switch--active" : ""}`}
                onClick={handleToggle}
                title={workflow?.isActive ? "Stop execution" : "Start execution"}
              >
                <div className="toggle-switch__knob" />
              </button>
              <span style={{ fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', color: workflow?.isActive ? "var(--accent)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                {workflow?.isActive ? "Running" : "Start Execution"}
              </span>
            </div>
            <button className="btn-ghost" onClick={() => navigate(`/workflows/${workflowId}/executions`)}>
              <Eye size={14} /> Executions
            </button>
            <button
              className="btn-outline-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={14} /> {isSaving ? "Saving..." : "Save"}
            </button>
            <button className="btn-commit" onClick={handleSaveAndCommit} disabled={isSaving}>
              <Play size={14} /> Commit to Executor
            </button>
          </div>
        </div>

        {/* ── Toast ── */}
        {toastState && (
          <div
            className="text-xs"
            style={{
              position: "absolute",
              right: 280,
              top: 56,
              zIndex: 50,
              maxWidth: 280,
              padding: "8px 12px",
              background: toastState.tone === "error" ? "var(--destructive-muted)" : "var(--accent-muted)",
              border: `1px solid ${toastState.tone === "error" ? "var(--destructive)" : "var(--accent)"}`,
              color: toastState.tone === "error" ? "var(--destructive)" : "var(--accent)",
            }}
          >
            {toastState.message}
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* ── Canvas (editable) ── */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Floating add node button */}
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 20, display: "flex", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <button className="btn-outline-sm" onClick={() => setShowPalette(!showPalette)}>
                  + Add Node
                </button>
                {showPalette && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, marginTop: 4,
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    padding: 8, minWidth: 180, zIndex: 30,
                  }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--accent)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Zap size={10} /> Triggers
                      </div>
                      {TRIGGER_PALETTE.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => { setPendingTriggerType(id); setEditingNodeId(null); setEditMetadata(undefined); setIsTriggerSheetOpen(true); setShowPalette(false); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", fontSize: 11, background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left" as const }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <Icon size={12} style={{ color: "var(--accent)" }} /> {label}
                        </button>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <ArrowLeftRight size={10} /> Actions
                      </div>
                      {ACTION_PALETTE.map(({ id, label }) => (
                        <button key={id} onClick={() => { setPendingActionType(id); setEditingNodeId(null); setEditMetadata(undefined); setIsActionSheetOpen(true); setShowPalette(false); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", fontSize: 11, background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left" as const }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b5cf6", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={10} /> Notifications
                      </div>
                      {NOTIFICATION_PALETTE.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => { setPendingNotificationType(id); setEditingNodeId(null); setEditMetadata(undefined); setIsNotificationSheetOpen(true); setShowPalette(false); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", fontSize: 11, background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer", textAlign: "left" as const }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <Icon size={12} style={{ color: "#8b5cf6" }} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onNodeClick={onNodeClick}
              onlyRenderVisibleElements
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--grid-dot)" />
              <Controls />
              <MiniMap style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 0 }} maskColor="rgba(0,0,0,0.3)" />
            </ReactFlow>
          </div>

          {/* ── Right Properties Panel ── */}
          <div className="properties-panel">
            <div className="properties-panel__title">Node Properties</div>
            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Workflow Info</div>
              <div className="properties-panel__row">
                <span className="properties-panel__row-key">ID</span>
                <span className="properties-panel__row-value">{workflowId?.slice(-8)}</span>
              </div>
              <div className="properties-panel__row">
                <span className="properties-panel__row-key">Status</span>
                <span className="properties-panel__row-value properties-panel__row-value--accent">{status}</span>
              </div>
              <div className="properties-panel__row">
                <span className="properties-panel__row-key">Nodes</span>
                <span className="properties-panel__row-value">{nodes.length}</span>
              </div>
              <div className="properties-panel__row">
                <span className="properties-panel__row-key">Edges</span>
                <span className="properties-panel__row-value">{edges.length}</span>
              </div>
            </div>

            <div className="properties-panel__section">
              <div className="properties-panel__section-title">Nodes</div>
              {nodes.length === 0 && (
                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>No nodes.</p>
              )}
              {nodes.map((node: any) => (
                <div
                  key={node.id}
                  className="properties-panel__node-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => onNodeClick(null, node)}
                >
                  <div className={`properties-panel__node-type ${(node.data.kind || "").toUpperCase() === "TRIGGER" ? "properties-panel__node-type--trigger" : ""}`}>
                    {getNodeTypeLabel(node)}
                  </div>
                  <div className="properties-panel__node-summary">
                    {getNodeSummary(node)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sheets ── */}
        <TriggerSheet
          open={isTriggerSheetOpen}
          onOpenChange={(v) => { setIsTriggerSheetOpen(v); if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingTriggerType(undefined); } }}
          onSelect={handleTriggerSelect}
          initialTrigger={pendingTriggerType}
          editMetadata={editingNodeId ? editMetadata : undefined}
        />
        <ActionSheet
          open={isActionSheetOpen}
          onOpenChange={(v) => { setIsActionSheetOpen(v); if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingActionType(undefined); } }}
          onSelect={handleActionSelect}
          initialAction={pendingActionType}
          editMetadata={editingNodeId ? editMetadata : undefined}
        />
        <NotificationSheet
          open={isNotificationSheetOpen}
          onOpenChange={(v) => { setIsNotificationSheetOpen(v); if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingNotificationType(undefined); } }}
          onSelect={handleNotificationSelect}
          initialType={pendingNotificationType}
          editMetadata={editingNodeId ? editMetadata : undefined}
        />
      </div>
    </div>
  );
};
