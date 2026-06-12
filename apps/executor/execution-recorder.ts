import { prisma } from "db/client";

const createExecution = async (params: {
  workflowId: string;
  nodeId: string;
  nodeName: string;
}) => {
  return prisma.execution.create({
    data: {
      workflowId: params.workflowId,
      nodeId: params.nodeId,
      nodeName: params.nodeName,
      status: "PENDING",
      startTime: new Date(),
    },
  });
};

const completeExecution = async (executionId: string, output?: unknown) => {
  return prisma.execution.update({
    where: { id: executionId },
    data: {
      status: "COMPLETED",
      endTime: new Date(),
      output: output ?? undefined,
    },
  });
};

const failExecution = async (executionId: string, error: string) => {
  return prisma.execution.update({
    where: { id: executionId },
    data: {
      status: "FAILED",
      endTime: new Date(),
      error,
    },
  });
};

export { createExecution, completeExecution, failExecution };
