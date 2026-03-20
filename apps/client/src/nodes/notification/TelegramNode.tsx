import { Handle, Position } from "@xyflow/react";
import { Send } from "lucide-react";

export type TelegramMetadata = {
  botToken: string;
  chatId: string;
  message: string;
};

export const TelegramNode = ({ data }: { data: { metadata: TelegramMetadata } }) => {
  const meta = data.metadata || { botToken: "", chatId: "", message: "" };
  return (
    <div className="node node--notification">
      <div className="node__header-split" style={{ borderLeftColor: "#0ea5e9" }}>
        <Send size={10} style={{ marginRight: 4 }} />
        NOTIFY // TELEGRAM
      </div>
      <div className="node__title">{meta.message ? meta.message.slice(0, 24) : "Telegram Alert"}</div>
      <div className="node__kv-table">
        <div className="node__kv-row">
          <span className="node__kv-key">CHAT ID</span>
          <span className="node__kv-value">{meta.chatId || "—"}</span>
        </div>
        <div className="node__kv-row">
          <span className="node__kv-key">MSG</span>
          <span className="node__kv-value" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta.message ? meta.message.slice(0, 30) + "…" : "—"}
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
};
