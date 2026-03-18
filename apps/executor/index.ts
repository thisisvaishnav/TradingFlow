import { connectToDatabase, WorkflowModel } from "db/client";
import type { PriceTriggerMetadata, TimerNodeMetadata } from "common";
import {
  evaluatePriceTrigger,
  evaluateTimerTrigger,
} from "./trigger-evaluator.ts";
import {
  executeWorkflowFromTrigger,
  type Workflow,
  type WorkflowNode,
} from "./graph-runner.ts";

const POLL_INTERVAL_MS = Number(
  process.env.EXECUTOR_POLL_INTERVAL_MS ?? 10_000,
);

let isShuttingDown = false;
let pollTimeoutId: ReturnType<typeof setTimeout> | null = null;

const isTriggerNode = (node: WorkflowNode): boolean => {
  return node.data.kind === "TRIGGER";
};

const inferTriggerType = (
  node: WorkflowNode,
): "price" | "timer" | "unknown" => {
  const metadata = node.data.metadata as Record<string, unknown>;

  if (node.type === "Price-trigger" || "price" in metadata || "asset" in metadata) {
    return "price";
  }
  if (node.type === "timer" || "time" in metadata) {
    return "timer";
  }

  return "unknown";
};

const evaluateAndExecuteWorkflow = async (workflow: Workflow): Promise<void> => {
  const triggerNodes = workflow.nodes.filter(isTriggerNode);

  for (const trigger of triggerNodes) {
    const triggerType = inferTriggerType(trigger);
    const triggerId = `${workflow._id}:${trigger.id}`;
    let fired = false;

    if (triggerType === "price") {
      fired = await evaluatePriceTrigger(
        triggerId,
        trigger.data.metadata as PriceTriggerMetadata,
      );
    } else if (triggerType === "timer") {
      fired = evaluateTimerTrigger(
        triggerId,
        trigger.data.metadata as TimerNodeMetadata,
      );
    }

    if (fired) {
      await executeWorkflowFromTrigger(workflow, trigger.id);
    }
  }
};

const runPollCycle = async (): Promise<void> => {
  try {
    const workflows = (await WorkflowModel.find().lean()) as unknown as Workflow[];

    if (workflows.length === 0) {
      return;
    }

    for (const workflow of workflows) {
      if (isShuttingDown) {
        break;
      }
      await evaluateAndExecuteWorkflow(workflow);
    }
  } catch (error) {
    console.error(
      "[executor] Poll cycle error:",
      error instanceof Error ? error.message : error,
    );
  }
};

const schedulePoll = () => {
  if (isShuttingDown) {
    return;
  }
  pollTimeoutId = setTimeout(async () => {
    await runPollCycle();
    schedulePoll();
  }, POLL_INTERVAL_MS);
};

const handleShutdown = (signal: string) => {
  console.log(`\n[executor] Received ${signal}, shutting down gracefully…`);
  isShuttingDown = true;

  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
  }

  process.exit(0);
};

const start = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("[executor] MONGO_URI is not set — exiting.");
    process.exit(1);
  }

  try {
    await connectToDatabase(mongoUri);
    console.log("[executor] Connected to MongoDB");
  } catch (error) {
    console.error("[executor] Failed to connect to MongoDB:", error);
    process.exit(1);
  }

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));

  console.log(
    `[executor] Starting workflow poller (interval: ${POLL_INTERVAL_MS}ms)`,
  );

  await runPollCycle();
  schedulePoll();
};

void start();
