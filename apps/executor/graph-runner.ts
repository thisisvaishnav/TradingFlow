import type { TradingMetadata } from "common";
import { getExchangeAdapter } from "./exchange-adapters/index.ts";
import { getNotificationHandler } from "./notification-handlers/index.ts";
import {
  createExecution,
  completeExecution,
  failExecution,
} from "./execution-recorder.ts";

export type WorkflowNode = {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data: {
    kind: string;
    metadata: Record<string, unknown>;
  };
};

const NODE_TYPE_LABELS: Record<string, string> = {
  "Price-trigger": "Price Trigger",
  "timer": "Timer",
  "Hyperliquid": "Hyperliquid",
  "Backpack": "Backpack",
  "Lighter": "Lighter",
  "Email": "Email",
  "Telegram": "Telegram",
};

const KIND_LABELS: Record<string, string> = {
  ACTION: "Action",
  TRIGGER: "Trigger",
  NOTIFICATION: "Notification",
};

const getNodeDisplayName = (node: WorkflowNode): string => {
  const typeLabel = NODE_TYPE_LABELS[node.type ?? ""] ?? node.type ?? "Unknown";
  const kindLabel = KIND_LABELS[node.data.kind] ?? node.data.kind;
  return `${typeLabel} (${kindLabel})`;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

export type Workflow = {
  _id: string;
  userId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

const buildAdjacencyList = (
  edges: WorkflowEdge[],
): Map<string, string[]> => {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source) ?? [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  }

  return adjacency;
};

const getTopologicalOrder = (
  startNodeId: string,
  adjacency: Map<string, string[]>,
): string[] => {
  const visited = new Set<string>();
  const order: string[] = [];

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    order.push(nodeId);
  };

  dfs(startNodeId);
  order.reverse();
  return order;
};

/**
 * Executes all action nodes downstream of the given trigger node.
 * Walks the graph in topological order. Halts the chain on the first failure.
 */
export const executeWorkflowFromTrigger = async (
  workflow: Workflow,
  triggerNodeId: string,
): Promise<void> => {
  const adjacency = buildAdjacencyList(workflow.edges);
  const executionOrder = getTopologicalOrder(triggerNodeId, adjacency);
  const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));

  const actionNodeIds = executionOrder.filter((id) => id !== triggerNodeId);

  if (actionNodeIds.length === 0) {
    console.log(
      `[graph-runner] Trigger ${triggerNodeId} in workflow ${workflow._id} has no downstream actions`,
    );
    return;
  }

  console.log(
    `[graph-runner] Executing ${actionNodeIds.length} action(s) for workflow ${workflow._id}`,
  );

  for (const nodeId of actionNodeIds) {
    const node = nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    const execution = await createExecution({
      workflowId: workflow._id,
      nodeId,
      nodeName: getNodeDisplayName(node),
    });

    try {
      const isNotification = node.data.kind === "NOTIFICATION" || node.type === "Email" || node.type === "Telegram";

      if (isNotification) {
        const handler = getNotificationHandler(node.type ?? "");
        if (!handler) {
          await failExecution(
            execution._id.toString(),
            `No notification handler for node type "${node.type}"`,
          );
          console.warn(
            `[graph-runner] Halting workflow ${workflow._id}: unknown notification type "${node.type}"`,
          );
          return;
        }

        const result = await handler(node.data.metadata);
        if (!result.success) {
          await failExecution(execution._id.toString(), result.message);
          console.warn(
            `[graph-runner] Halting workflow ${workflow._id}: notification failed at node ${nodeId}`,
          );
          return;
        }

        await completeExecution(execution._id.toString(), result);
      } else {
        const adapter = getExchangeAdapter(node.type ?? "");
        if (!adapter) {
          await failExecution(
            execution._id.toString(),
            `No exchange adapter for node type "${node.type}"`,
          );
          console.warn(
            `[graph-runner] Halting workflow ${workflow._id}: unknown node type "${node.type}"`,
          );
          return;
        }

        const metadata = node.data.metadata as TradingMetadata;
        const result = await adapter(metadata);

        if (!result.success) {
          await failExecution(execution._id.toString(), result.message);
          console.warn(
            `[graph-runner] Halting workflow ${workflow._id}: action failed at node ${nodeId}`,
          );
          return;
        }

        await completeExecution(execution._id.toString(), result);
      }

      console.log(
        `[graph-runner] Node ${nodeId} completed in workflow ${workflow._id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown execution error";
      await failExecution(execution._id.toString(), errorMessage);
      console.error(
        `[graph-runner] Halting workflow ${workflow._id}: unhandled error at node ${nodeId}:`,
        errorMessage,
      );
      return;
    }
  }

  console.log(
    `[graph-runner] Workflow ${workflow._id} execution completed successfully`,
  );
};
