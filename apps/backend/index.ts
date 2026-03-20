import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { ExecutionModel, User, WorkflowModel, connectToDatabase } from "db/client";
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

const isDuplicateKeyError = (error: unknown) => {
    if (!error || typeof error !== "object") {
        return false;
    }

    return "code" in error && error.code === 11000;
};

const getAuthenticatedUserId = (req: AuthenticatedRequest, res: express.Response) => {
    if (!req.userId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return null;
    }

    return req.userId;
};

app.post("/signup", async (req,res) => {
    const { success, data } = SignupSchema.safeParse(req.body);
    if (!success) {
       return res.status(400).json({
        message: "Incorrect inputs"
       });
    }
    const normalizedUsername = data.username.toLowerCase();

    try {
        const existingUser = await User.findOne({ username: normalizedUsername });
        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const user = await User.create({
            username: normalizedUsername,
            password: hashedPassword,
        });

        const token = createToken(user._id.toString(), user.username);
        return res.status(201).json({
            message: "User created successfully",
            id: user._id,
            token
        });
    } catch (err) {
            if (isDuplicateKeyError(err)) {
                return res.status(409).json({
                    message: "Username already exists"
                });
            }

            return res.status(500).json({
                message: "Internal server error",
                error: err instanceof Error ? err.message : "Unknown error"
            });
    }
})

app.post("/signin", async (req,res) => {
    const { success, data } = SigninSchema.safeParse(req.body);
    if (!success) {
        return res.status(400).json({
            message: "Incorrect inputs"
        });
    }

    const normalizedUsername = data.username.toLowerCase();

    try {
        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const passwordMatch = await bcrypt.compare(data.password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = createToken(user._id.toString(), user.username);

        return res.status(200).json({
            message: "Signin successful",
            id: user._id,
            token
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
    }
})

app.post("/workflow", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    const parsedBody = CreateWorkflowSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Incorrect workflow inputs",
            errors: parsedBody.error.issues
        });
    }

    try {
        const normalizedNodes = parsedBody.data.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
                kind: node.data.kind.toUpperCase(),
                metadata: node.data.metadata
            }
        }));

        const normalizedEdges = parsedBody.data.edges.map((edge, index) => ({
            id: `edge-${Date.now()}-${index}`,
            source: edge.source,
            target: edge.target
        }));

        const workflow = await WorkflowModel.create({
            userId,
            name: parsedBody.data.name || "Untitled Workflow",
            nodes: normalizedNodes,
            edges: normalizedEdges
        });

        return res.status(201).json({
            message: "Workflow created successfully",
            workflow
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.put("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    const parsedBody = UpdateWorkflowSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({
            message: "Incorrect workflow inputs",
            errors: parsedBody.error.issues
        });
    }

    try {
        const normalizedNodes = parsedBody.data.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position ?? { x: 0, y: 0 },
            data: {
                kind: node.data.kind.toUpperCase(),
                metadata: node.data.metadata
            }
        }));

        const normalizedEdges = parsedBody.data.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target
        }));

        const updateFields: Record<string, unknown> = {
            nodes: normalizedNodes,
            edges: normalizedEdges,
        };
        if (parsedBody.data.name !== undefined) updateFields.name = parsedBody.data.name;
        if (parsedBody.data.status !== undefined) updateFields.status = parsedBody.data.status;
        if (parsedBody.data.isActive !== undefined) updateFields.isActive = parsedBody.data.isActive;

        const updatedWorkflow = await WorkflowModel.findOneAndUpdate(
            { _id: req.params.workflowId, userId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedWorkflow) {
            return res.status(404).json({
                message: "Workflow not found"
            });
        }

        return res.status(200).json({
            message: "Workflow updated successfully",
            workflow: updatedWorkflow
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.get("/workflow", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    try {
        const workflows = await WorkflowModel.find({ userId });
        return res.status(200).json({
            workflows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.patch("/workflow/:workflowId/toggle", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    try {
        const workflow = await WorkflowModel.findOne({
            _id: req.params.workflowId,
            userId
        });

        if (!workflow) {
            return res.status(404).json({
                message: "Workflow not found"
            });
        }

        const newIsActive = !workflow.isActive;
        const newStatus = newIsActive ? "ACTIVE" : "INACTIVE";

        const updatedWorkflow = await WorkflowModel.findOneAndUpdate(
            { _id: req.params.workflowId, userId },
            { $set: { isActive: newIsActive, status: newStatus } },
            { new: true }
        );

        return res.status(200).json({
            message: `Workflow ${newIsActive ? "activated" : "deactivated"}`,
            workflow: updatedWorkflow
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.delete("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    try {
        const workflow = await WorkflowModel.findOneAndDelete({
            _id: req.params.workflowId,
            userId
        });

        if (!workflow) {
            return res.status(404).json({
                message: "Workflow not found"
            });
        }

        // Also delete associated executions
        await ExecutionModel.deleteMany({ workflowId: req.params.workflowId });

        return res.status(200).json({
            message: "Workflow deleted"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.get("/workflow/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    try {
        const workflow = await WorkflowModel.findOne({
            _id: req.params.workflowId,
            userId
        });

        if (!workflow) {
            return res.status(404).json({
                message: "Workflow not found"
            });
        }

        return res.status(200).json(workflow);
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.get("/workflow/execution/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) {
        return;
    }

    try {
        const workflow = await WorkflowModel.findOne({
            _id: req.params.workflowId,
            userId
        });

        if (!workflow) {
            return res.status(404).json({
                message: "Workflow not found"
            });
        }

        const executions = await ExecutionModel.find({
            workflowId: req.params.workflowId
        }).sort({ startTime: -1 });

        return res.status(200).json({
            executions
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

app.get("/workflow/execution/:workflowId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    return res.redirect(308, `/workflow/execution/${req.params.workflowId}`);
});

const startServer = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error("Mongo connection failed: MONGO_URI is not set");
            process.exit(1);
        }

        await connectToDatabase(mongoUri);
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    } catch (error) {
        console.error("Mongo connection failed:", error);
        process.exit(1);
    }
};

void startServer();
