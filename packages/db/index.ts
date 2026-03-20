import mongoose from "mongoose";

const { Schema } = mongoose;

export const connectToDatabase = async (mongoUri: string) => {
  return mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
};

/* ================= USER ================= */
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export const User = mongoose.model("User", UserSchema);

/* ================= CREDENTIALS ================= */
const CredentialsTypeSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["string", "number"], required: true },
});

/* ================= NODES ================= */
const NodesSchema = new Schema({
  title: { type: String, required: true }, 
  description: { type: String, required: true },
  type: { type: String, enum: ["ACTION", "TRIGGER"], required: true },
  credentialsType: CredentialsTypeSchema,
});

export const Nodes = mongoose.model("Nodes", NodesSchema);

/* ================= EDGES ================= */
const EdgesSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
  },
  { _id: false }
);

export const Edges = mongoose.model("Edges", EdgesSchema);

/* ================= POSITION ================= */
const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

/* ================= NODE DATA ================= */
const NodeDataSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["ACTION", "TRIGGER", "NOTIFICATION"],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

/* ================= WORKFLOW NODES ================= */
const WorkflowNodesSchema = new Schema(
  {
    id: { type: String, required: true },
    position: PositionSchema,
    type: { type: String },
    data: NodeDataSchema,
  },
  { _id: false }
);



/* ================= WORKFLOW ================= */
const workflowSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    default: "Untitled Workflow",
  },
  status: {
    type: String,
    enum: ["DRAFT", "ACTIVE", "INACTIVE"],
    default: "DRAFT",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  nodes: [WorkflowNodesSchema],
  edges: [EdgesSchema],
});

export const WorkflowModel = mongoose.model("Workflow", workflowSchema);

/* ================= EXECUTION ================= */
const ExecutionSchema = new Schema({
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: "Workflow",
    required: true,
  },
  nodeId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "FAILED"],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  error: {
    type: String,
  },
  output: {
    type: Schema.Types.Mixed,
  },
});

export const ExecutionModel = mongoose.model("Execution", ExecutionSchema);