import { z } from "zod";
export {
    SUPPORTED_ASSETS
} from "../metadata";
export type {
    PriceTriggerMetadata,
    TimerNodeMetadata,
    TradingMetadata
} from "../metadata";

export const SignupSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(20),
});
   
export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(8).max(20),
});

export const CreateWorkflowSchema = z.object({ 
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({
            x: z.number(),
            y: z.number(),
        }),
        data: z.object({
            kind: z.enum(["action", "trigger"]),
            metadata: z.record(z.string(), z.unknown()),
        }),
    })),
    edges: z.array(z.object({
        source: z.string(),
        target: z.string(),
    })),
});

export const UpdateWorkflowSchema = z.object({ 
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string().optional(),
        position: z.object({
            x: z.number(),
            y: z.number(),
        }).optional(),
        data: z.object({
            kind: z.enum(["action", "trigger"]),
            metadata: z.record(z.string(), z.unknown()),
        }),
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
    })),
});