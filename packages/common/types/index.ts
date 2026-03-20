import { z } from "zod";
export {
    SUPPORTED_ASSETS
} from "../metadata";
export type {
    PriceTriggerMetadata,
    TimerNodeMetadata,
    TradingMetadata,
    EmailMetadata,
    TelegramMetadata,
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
    name: z.string().optional(),
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({
            x: z.number(),
            y: z.number(),
        }),
        data: z.object({
            kind: z.enum(["action", "trigger", "notification"]),
            metadata: z.record(z.string(), z.unknown()),
        }),
    })),
    edges: z.array(z.object({
        source: z.string(),
        target: z.string(),
    })),
});

export const UpdateWorkflowSchema = z.object({ 
    name: z.string().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
    isActive: z.boolean().optional(),
    nodes: z.array(z.object({
        id: z.string(),
        type: z.string().optional(),
        position: z.object({
            x: z.number(),
            y: z.number(),
        }).optional(),
        data: z.object({
            kind: z.enum(["action", "trigger", "notification"]),
            metadata: z.record(z.string(), z.unknown()),
        }),
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
    })),
});