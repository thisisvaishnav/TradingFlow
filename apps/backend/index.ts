import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { prisma, connectToDatabase } from "db/client";
import { CreateWorkflowSchema, SigninSchema, SignupSchema, UpdateWorkflowSchema } from "common";
import { authenticateToken, createToken, type AuthenticatedRequest } from "./auth-middleware";

const SALT_ROUNDS = 12;

const app = express();
const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];
const configuredAllowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];
const allowedOrigins = configuredAllowedOrigins.length ? configuredAllowedOrigins : defaultAllowedOrigins;

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Health check endpoint (used by Docker healthcheck)
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

const isDuplicateKeyError = (error: unknown) => {
    // Prisma unique constraint violation code
    if (!error || typeof error !== "object") return false;
    return "code" in error && error.code === "P2002";
};

const getAuthenticatedUserId = (req: AuthenticatedRequest, res: express.Response) => {
    if (!req.userId) {
        res.status(401).json({ message: "Unauthorized" });
        return null;
    }
    return req.userId;
};

/* ─── AUTH ──────────────────────────────────────────────────────────────────── */

app.post("/signup", async (req, res) => {
    const { success, data } = SignupSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ message: "Incorrect inputs" });
    }
    const normalizedUsername = data.username.toLowerCase();

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username: normalizedUsername },
        });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                username: normalizedUsername,
                password: hashedPassword,
            },
        });

        const token = createToken(user.id, user.username);
        return res.status(201).json({
            message: "User created successfully",
            id: user.id,
            token,
        });
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(409).json({ message: "Username already exists" });
        }
        return res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

app.post("/signin", async (req, res) => {
    const { success, data } = SigninSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ message: "Incorrect inputs" });
    }
    const normalizedUsername = data.username.toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { username: normalizedUsername },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const passwordMatch = await bcrypt.compare(data.password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = createToken(user.id, user.username);
        return res.status(200).json({
            message: "Signin successful",
            id: user.id,
            token,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});

/* ─── WORKFLOWS ─────────────────────────────────────────────────────────────── */

app.post("/workflow", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parsedBody = CreateWorkflowSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Incorrect workflow inputs",
            errors: parsedBody.error.issues,
        });
    }

    try {
        const normalizedNodes = parsedBody.data.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
                kind: node.data.kind.toUpperCase(),
                metadata: node.data.metadata,
            },
        }));

        const normalizedEdges = parsedBody.data.edges.map((edge, index) => ({
            id: `edge-${Date.now()}-${index}`,
            source: edge.source,
            target: edge.target,
        }));

        const workflow = await prisma.workflow.create({
            data: {
                userId,
                name: parsedBody.data.name || "Untitled Workflow",
                // Prisma Json type requires casting typed arrays through unknown
                nodes: normalizedNodes as unknown as Parameters<typeof prisma.workflow.create>[0]["data"]["nodes"],
                edges: normalizedEdges as unknown as Parameters<typeof prisma.workflow.create>[0]["data"]["edges"],
            },
        });

        return res.status(201).json({
            message: "Workflow created successfully",
            workflow,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.put("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const parsedBody = UpdateWorkflowSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Incorrect workflow inputs",
            errors: parsedBody.error.issues,
        });
    }
    const workflowId = req.params.workflowId as string;

    try {
        // Verify ownership before updating
        const existing = await prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { userId: true },
        });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        const normalizedNodes = parsedBody.data.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position ?? { x: 0, y: 0 },
            data: {
                kind: node.data.kind.toUpperCase(),
                metadata: node.data.metadata,
            },
        }));

        const normalizedEdges = parsedBody.data.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
        }));

        const updateData: Record<string, unknown> = {
            nodes: normalizedNodes,
            edges: normalizedEdges,
        };
        if (parsedBody.data.name !== undefined) updateData.name = parsedBody.data.name;
        if (parsedBody.data.status !== undefined) updateData.status = parsedBody.data.status;
        if (parsedBody.data.isActive !== undefined) updateData.isActive = parsedBody.data.isActive;

        const updatedWorkflow = await prisma.workflow.update({
            where: { id: workflowId },
            data: updateData,
        });

        return res.status(200).json({
            message: "Workflow updated successfully",
            workflow: updatedWorkflow,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.get("/workflow", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    try {
        const workflows = await prisma.workflow.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ workflows });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.patch("/workflow/:workflowId/toggle", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    const workflowId = req.params.workflowId as string;

    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow || workflow.userId !== userId) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        const newIsActive = !workflow.isActive;
        const newStatus = newIsActive ? "ACTIVE" : "INACTIVE";

        const updatedWorkflow = await prisma.workflow.update({
            where: { id: workflowId },
            data: { isActive: newIsActive, status: newStatus },
        });

        return res.status(200).json({
            message: `Workflow ${newIsActive ? "activated" : "deactivated"}`,
            workflow: updatedWorkflow,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.delete("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    const workflowId = req.params.workflowId as string;

    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { userId: true },
        });

        if (!workflow || workflow.userId !== userId) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        // Cascade delete is handled by Prisma schema (onDelete: Cascade on Execution)
        await prisma.workflow.delete({
            where: { id: workflowId },
        });

        return res.status(200).json({ message: "Workflow deleted" });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.get("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    const workflowId = req.params.workflowId as string;

    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow || workflow.userId !== userId) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        return res.status(200).json(workflow);
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.get("/workflow/execution/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;
    const workflowId = req.params.workflowId as string;

    try {
        // Verify the workflow belongs to this user
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { userId: true },
        });

        if (!workflow || workflow.userId !== userId) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        const executions = await prisma.execution.findMany({
            where: { workflowId },
            orderBy: { startTime: "desc" },
        });

        return res.status(200).json({ executions });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/* ─── Server startup ────────────────────────────────────────────────────────── */

const startServer = async () => {
    try {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            console.error("DB connection failed: DATABASE_URL is not set");
            process.exit(1);
        }

        await connectToDatabase(databaseUrl);
        console.log("Connected to PostgreSQL via Prisma");

        const port = Number(process.env.PORT) || 3001;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("DB connection failed:", error);
        process.exit(1);
    }
};

void startServer();
