import { Handle, Position } from "@xyflow/react";
import { Mail } from "lucide-react";

export type EmailMetadata = {
  to: string;
  subject: string;
  body: string;
};

export const EmailNode = ({ data }: { data: { metadata: EmailMetadata } }) => {
  const meta = data.metadata || { to: "", subject: "", body: "" };
  return (
    <div className="node node--notification">
      <div className="node__header-split" style={{ borderLeftColor: "#8b5cf6" }}>
        <Mail size={10} style={{ marginRight: 4 }} />
        NOTIFY // EMAIL
      </div>
      <div className="node__title">{meta.subject || "Email Alert"}</div>
      <div className="node__kv-table">
        <div className="node__kv-row">
          <span className="node__kv-key">TO</span>
          <span className="node__kv-value" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta.to || "—"}
          </span>
        </div>
        <div className="node__kv-row">
          <span className="node__kv-key">BODY</span>
          <span className="node__kv-value" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta.body ? meta.body.slice(0, 30) + "…" : "—"}
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
};
