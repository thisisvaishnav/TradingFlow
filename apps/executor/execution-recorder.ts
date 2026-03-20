import { ExecutionModel } from "db/client";

const createExecution = async (params: {
  workflowId: string;
  nodeId: string;
  nodeName: string;
}) => {
  return ExecutionModel.create({
    workflowId: params.workflowId,
    nodeId: params.nodeId,
    nodeName: params.nodeName,
    status: "PENDING",
    startTime: new Date(),
  });
};


const completeExecution = async (executionId: string, output?: unknown) => {
  return ExecutionModel.findByIdAndUpdate(
    executionId,
    { status: "COMPLETED", endTime: new Date(), output },
    { returnDocument: "after" },
  );
};


const failExecution = async (executionId: string, error: string) => {
  return ExecutionModel.findByIdAndUpdate(
    executionId,
    { status: "FAILED", endTime: new Date(), error },
    { returnDocument: "after" },
  );
};

export { createExecution, completeExecution, failExecution };
