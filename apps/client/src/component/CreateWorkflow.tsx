import { useState, useCallback } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Play, Clock, TrendingUp, ArrowLeftRight, Zap, Mail, Send } from "lucide-react";
import { TriggerSheet } from './TriggerSheet';
import { PriceTriggerNode } from '@/nodes/triggers/PriceTrigger';
import { TimerNode } from '@/nodes/triggers/Timer';
import { ActionSheet } from './ActionSheet';
import { NotificationSheet } from './NotificationSheet';
import { Hyperliquid } from '@/nodes/action/Hyperliquid';
import { Backpack } from '@/nodes/action/Backpack';
import { Lighter } from '@/nodes/action/Lighter';
import { EmailNode } from '@/nodes/notification/EmailNode';
import { TelegramNode } from '@/nodes/notification/TelegramNode';
import { AppSidebar } from './AppSidebar';
import { authStorage, tradingFlowApiClient, type CreateWorkflowPayload } from '@/lib/api-client';

export type NodeKind = "Price-trigger" | "timer" | "Hyperliquid" | "Backpack" | "Lighter" | "Email" | "Telegram";

const nodeTypes = {
    "Price-trigger": PriceTriggerNode,
    "timer": TimerNode,
    "Hyperliquid": Hyperliquid,
    "Backpack": Backpack,
    "Lighter": Lighter,
    "Email": EmailNode,
    "Telegram": TelegramNode,
};

export type NodeMetadata = any;

export interface WorkflowNode {
    id: string;
    type: string;
    position: { x: number, y: number };
    data: { type: NodeKind, kind: "action" | "trigger" | "notification", metadata: NodeMetadata }
}

interface Edge { id: string; source: string; target: string }

type ToastState = { message: string; tone: "error" | "success" } | null;

const TRIGGER_PALETTE = [
    { id: "Price-trigger" as NodeKind, label: "Price Trigger", icon: TrendingUp },
    { id: "timer" as NodeKind, label: "Timer", icon: Clock },
];

const ACTION_PALETTE = [
    { id: "Hyperliquid" as NodeKind, label: "Hyperliquid", comingSoon: true },
    { id: "Backpack" as NodeKind, label: "Backpack", comingSoon: true },
    { id: "Lighter" as NodeKind, label: "Lighter", comingSoon: false },
];

const NOTIFICATION_PALETTE = [
    { id: "Email" as NodeKind, label: "Email Alert", icon: Mail },
    { id: "Telegram" as NodeKind, label: "Telegram Alert", icon: Send },
];

/** Get a node summary string for the properties panel */
const getNodeSummary = (node: WorkflowNode): string => {
    const meta = node.data.metadata;
    if (node.data.kind === "trigger") {
        if (meta?.asset && meta?.price) return `${meta.asset} > $${meta.price}`;
        if (meta?.time) return `Every ${meta.time}s`;
        return "Trigger";
    }
    if (meta?.type && meta?.symbol) return `${meta.type} ${meta.symbol}`;
    if (node.data.kind === "notification") {
        if (node.type === "Email") return meta?.to || "Email";
        if (node.type === "Telegram") return meta?.chatId || "Telegram";
        return "Notification";
    }
    return "Action";
};

/** Get node type label for properties panel */
const getNodeTypeLabel = (node: WorkflowNode): string => {
    if (node.data.kind === "trigger") {
        if (node.type === "Price-trigger") return "TRIGGER // PRICE";
        if (node.type === "timer") return "TRIGGER // TIMER";
        return "TRIGGER";
    }
    if (node.data.kind === "notification") {
        return `NOTIFY // ${node.type?.toUpperCase() ?? "NOTIFY"}`;
    }
    return `ACTION // ${node.type?.toUpperCase() ?? "ACTION"}`;
};

export function CreateWorkflow() {
    const navigate = useNavigate();
    const location = useLocation();
    const templateData = (location.state as any)?.template;

    const [nodes, setNodes] = useState<WorkflowNode[]>(() => {
        if (templateData?.nodes) {
            return templateData.nodes.map((n: any) => ({
                ...n,
                data: { ...n.data, type: n.type, kind: n.data.kind },
            }));
        }
        return [];
    });
    const [edges, setEdges] = useState<Edge[]>(() => {
        if (templateData?.edges) {
            return templateData.edges.map((e: any, i: number) => ({ id: `e-${i}`, ...e }));
        }
        return [];
    });
    const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(false);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toastState, setToastState] = useState<ToastState>(null);
    const [workflowName, setWorkflowName] = useState(templateData?.name || "New Workflow");
    const [showPalette, setShowPalette] = useState(false);

    // Pre-selection for sheets
    const [pendingTriggerType, setPendingTriggerType] = useState<string | undefined>();
    const [pendingActionType, setPendingActionType] = useState<string | undefined>();
    const [pendingNotificationType, setPendingNotificationType] = useState<string | undefined>();

    // Edit mode
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editMetadata, setEditMetadata] = useState<NodeMetadata | undefined>();

    const showToast = (message: string, tone: "error" | "success" = "error") => {
        setToastState({ message, tone });
        window.setTimeout(() => setToastState(null), 3200);
    };

    const onNodesChange = useCallback(
        (changes: any) => setNodes((s: any) => applyNodeChanges(changes, s)), [],
    );
    const onEdgesChange = useCallback(
        (changes: any) => setEdges((s: any) => applyEdgeChanges(changes, s)), [],
    );
    const onConnect = useCallback(
        (params: any) => setEdges((s: any) => addEdge(params, s)), [],
    );

    // Handle node click for editing
    const onNodeClick = useCallback((_: any, node: WorkflowNode) => {
        setEditingNodeId(node.id);
        setEditMetadata(node.data.metadata);
        if (node.data.kind === "trigger") {
            setPendingTriggerType(node.type);
            setIsTriggerSheetOpen(true);
        } else if (node.data.kind === "notification") {
            setPendingNotificationType(node.type);
            setIsNotificationSheetOpen(true);
        } else {
            setPendingActionType(node.type);
            setIsActionSheetOpen(true);
        }
    }, []);

    const handleTriggerSelect = (kind: NodeKind, metadata: NodeMetadata) => {
        if (editingNodeId) {
            // Edit existing node
            setNodes((prev) => prev.map((n) =>
                n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
            ));
            setEditingNodeId(null);
            setEditMetadata(undefined);
        } else {
            // Add new node
            setNodes((prev) => [...prev, {
                id: Math.random().toString(), type: kind,
                position: { x: 120 + prev.length * 40, y: 100 + prev.length * 30 },
                data: { type: kind, kind: "trigger", metadata },
            }]);
        }
        setIsTriggerSheetOpen(false);
        setPendingTriggerType(undefined);
    };

    const handleActionSelect = (kind: NodeKind, metadata: NodeMetadata) => {
        if (editingNodeId) {
            // Edit existing node
            setNodes((prev) => prev.map((n) =>
                n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
            ));
            setEditingNodeId(null);
            setEditMetadata(undefined);
        } else {
            // Add new node
            setNodes((prev) => [...prev, {
                id: Math.random().toString(), type: kind,
                position: { x: 400 + prev.length * 40, y: 100 + prev.length * 30 },
                data: { type: kind, kind: "action", metadata },
            }]);
        }
        setIsActionSheetOpen(false);
        setPendingActionType(undefined);
    };

    const handleNotificationSelect = (kind: NodeKind, metadata: NodeMetadata) => {
        if (editingNodeId) {
            setNodes((prev) => prev.map((n) =>
                n.id === editingNodeId ? { ...n, type: kind, data: { ...n.data, type: kind, metadata } } : n
            ));
            setEditingNodeId(null);
            setEditMetadata(undefined);
        } else {
            setNodes((prev) => [...prev, {
                id: Math.random().toString(), type: kind,
                position: { x: 600 + prev.length * 40, y: 100 + prev.length * 30 },
                data: { type: kind, kind: "notification", metadata },
            }]);
        }
        setIsNotificationSheetOpen(false);
        setPendingNotificationType(undefined);
    };

    const handleSave = async () => {
        if (!nodes.length) { showToast("Add at least one node"); return; }
        const token = authStorage.getToken();
        if (!token) { showToast("Please sign in first"); return; }

        const payload: CreateWorkflowPayload = {
            name: workflowName,
            nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: { kind: n.data.kind, metadata: n.data.metadata as Record<string, unknown> } })),
            edges: edges.map((e) => ({ source: e.source, target: e.target })),
        };

        try {
            setIsSaving(true);
            const { workflow } = await tradingFlowApiClient.createWorkflow(payload, token);
            navigate(`/workflows/${workflow._id}`, { state: { toastMessage: "Workflow saved" } });
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndCommit = async () => {
        if (!nodes.length) { showToast("Add at least one node"); return; }
        const token = authStorage.getToken();
        if (!token) { showToast("Please sign in first"); return; }

        const payload: CreateWorkflowPayload = {
            name: workflowName,
            nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: { kind: n.data.kind, metadata: n.data.metadata as Record<string, unknown> } })),
            edges: edges.map((e) => ({ source: e.source, target: e.target })),
        };

        try {
            setIsSaving(true);
            const { workflow } = await tradingFlowApiClient.createWorkflow(payload, token);
            // Immediately activate execution
            await tradingFlowApiClient.toggleWorkflow(workflow._id, token);
            navigate(`/workflows/${workflow._id}`, { state: { toastMessage: "Workflow saved & execution started" } });
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

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
                                onChange={(e) => setWorkflowName(e.target.value)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    width: "auto",
                                    minWidth: 120,
                                    padding: 0,
                                }}
                            />
                            <span className="workflow-topbar__meta">DRAFT // ID: —</span>
                        </div>
                    </div>
                    <div className="workflow-topbar__right">
                        <button
                            className="btn-outline-sm"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={14} /> {isSaving ? "Saving..." : "Save Draft"}
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
                    {/* ── Canvas ── */}
                    <div style={{ flex: 1, position: "relative" }}>
                        {/* Floating add node button */}
                        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 20, display: "flex", gap: 8 }}>
                            <div style={{ position: "relative" }}>
                                <button
                                    className="btn-outline-sm"
                                    onClick={() => setShowPalette(!showPalette)}
                                >
                                    + Add Node
                                </button>
                                {showPalette && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            marginTop: 4,
                                            background: "var(--bg-surface)",
                                            border: "1px solid var(--border)",
                                            padding: 8,
                                            minWidth: 180,
                                            zIndex: 30,
                                        }}
                                    >
                                        <div style={{ marginBottom: 8 }}>
                                            <div style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase" as const,
                                                color: "var(--accent)",
                                                marginBottom: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                <Zap size={10} /> Triggers
                                            </div>
                                            {TRIGGER_PALETTE.map(({ id, label, icon: Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        setPendingTriggerType(id);
                                                        setEditingNodeId(null);
                                                        setEditMetadata(undefined);
                                                        setIsTriggerSheetOpen(true);
                                                        setShowPalette(false);
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        width: "100%",
                                                        padding: "6px 8px",
                                                        fontSize: 11,
                                                        background: "transparent",
                                                        border: "none",
                                                        color: "var(--text-primary)",
                                                        cursor: "pointer",
                                                        textAlign: "left" as const,
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                >
                                                    <Icon size={12} style={{ color: "var(--accent)" }} />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                                            <div style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase" as const,
                                                color: "var(--text-muted)",
                                                marginBottom: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                <ArrowLeftRight size={10} /> Actions
                                            </div>
                                            {ACTION_PALETTE.map(({ id, label, comingSoon }) => (
                                                <button
                                                    key={id}
                                                    disabled={comingSoon}
                                                    aria-label={comingSoon ? `${label} — coming soon` : label}
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        if (comingSoon) return;
                                                        setPendingActionType(id);
                                                        setEditingNodeId(null);
                                                        setEditMetadata(undefined);
                                                        setIsActionSheetOpen(true);
                                                        setShowPalette(false);
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: 8,
                                                        width: "100%",
                                                        padding: "6px 8px",
                                                        fontSize: 11,
                                                        background: "transparent",
                                                        border: "none",
                                                        color: comingSoon ? "var(--text-muted)" : "var(--text-primary)",
                                                        cursor: comingSoon ? "not-allowed" : "pointer",
                                                        textAlign: "left" as const,
                                                        opacity: comingSoon ? 0.55 : 1,
                                                    }}
                                                    onMouseEnter={(e) => { if (!comingSoon) e.currentTarget.style.background = "var(--bg-card)"; }}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                >
                                                    <span>{label}</span>
                                                    {comingSoon && (
                                                        <span style={{
                                                            fontSize: 8,
                                                            fontWeight: 700,
                                                            letterSpacing: "0.06em",
                                                            textTransform: "uppercase",
                                                            padding: "2px 5px",
                                                            background: "var(--border)",
                                                            color: "var(--text-muted)",
                                                            borderRadius: 2,
                                                            whiteSpace: "nowrap",
                                                        }}>
                                                            Soon
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                                            <div style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                                textTransform: "uppercase" as const,
                                                color: "#8b5cf6",
                                                marginBottom: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}>
                                                <Mail size={10} /> Notifications
                                            </div>
                                            {NOTIFICATION_PALETTE.map(({ id, label, icon: Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        setPendingNotificationType(id);
                                                        setEditingNodeId(null);
                                                        setEditMetadata(undefined);
                                                        setIsNotificationSheetOpen(true);
                                                        setShowPalette(false);
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        width: "100%",
                                                        padding: "6px 8px",
                                                        fontSize: 11,
                                                        background: "transparent",
                                                        border: "none",
                                                        color: "var(--text-primary)",
                                                        cursor: "pointer",
                                                        textAlign: "left" as const,
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                >
                                                    <Icon size={12} style={{ color: "#8b5cf6" }} />
                                                    {label}
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
                            onNodeClick={onNodeClick as any}
                            onlyRenderVisibleElements
                        >
                            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--grid-dot)" />
                            <Controls />
                            <MiniMap
                                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 0 }}
                                maskColor="rgba(0,0,0,0.3)"
                            />
                        </ReactFlow>
                    </div>

                    {/* ── Right Properties Panel ── */}
                    <div className="properties-panel">
                        <div className="properties-panel__title">Node Properties</div>

                        {/* Workflow Info */}
                        <div className="properties-panel__section">
                            <div className="properties-panel__section-title">Workflow Info</div>
                            <div className="properties-panel__row">
                                <span className="properties-panel__row-key">ID</span>
                                <span className="properties-panel__row-value">—</span>
                            </div>
                            <div className="properties-panel__row">
                                <span className="properties-panel__row-key">Status</span>
                                <span className="properties-panel__row-value properties-panel__row-value--accent">DRAFT</span>
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

                        {/* Nodes list */}
                        <div className="properties-panel__section">
                            <div className="properties-panel__section-title">Nodes</div>
                            {nodes.length === 0 && (
                                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                    No nodes added yet.
                                </p>
                            )}
                            {nodes.map((node) => (
                                <div
                                    key={node.id}
                                    className="properties-panel__node-card"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => onNodeClick(null, node)}
                                >
                                    <div className={`properties-panel__node-type ${node.data.kind === "trigger" ? "properties-panel__node-type--trigger" : ""}`}>
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
                    onOpenChange={(v) => {
                        setIsTriggerSheetOpen(v);
                        if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingTriggerType(undefined); }
                    }}
                    onSelect={handleTriggerSelect}
                    initialTrigger={pendingTriggerType}
                    editMetadata={editingNodeId ? editMetadata : undefined}
                />
                <ActionSheet
                    open={isActionSheetOpen}
                    onOpenChange={(v) => {
                        setIsActionSheetOpen(v);
                        if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingActionType(undefined); }
                    }}
                    onSelect={handleActionSelect}
                    initialAction={pendingActionType}
                    editMetadata={editingNodeId ? editMetadata : undefined}
                />
                <NotificationSheet
                    open={isNotificationSheetOpen}
                    onOpenChange={(v) => {
                        setIsNotificationSheetOpen(v);
                        if (!v) { setEditingNodeId(null); setEditMetadata(undefined); setPendingNotificationType(undefined); }
                    }}
                    onSelect={handleNotificationSelect}
                    initialType={pendingNotificationType}
                    editMetadata={editingNodeId ? editMetadata : undefined}
                />
            </div>
        </div>
    );
}
