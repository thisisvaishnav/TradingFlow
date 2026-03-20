import { Handle, Position } from "@xyflow/react";
import type { TradingMetadata } from "./Hyperliquid";

export const Backpack = ({ data }: { data: { metadata: TradingMetadata } }) => {
  return (
    <div className="node node--action" style={{ opacity: 0.55, position: "relative" }}>
      <div className="node__header-split" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>ACTION // BACKPACK</span>
        <span style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "1px 4px",
          background: "var(--text-muted)",
          color: "var(--bg-base)",
          borderRadius: 2,
          marginLeft: 6,
        }}>
          Soon
        </span>
      </div>
      <div className="node__title">{data.metadata.type} {data.metadata.symbol}</div>
      <div className="node__kv-table">
        <div className="node__kv-row">
          <span className="node__kv-key">SIDE</span>
          <span className={`node__kv-value ${data.metadata.type === "LONG" ? "trade-type--long" : "trade-type--short"}`}>
            {data.metadata.type}
          </span>
        </div>
        <div className="node__kv-row">
          <span className="node__kv-key">SIZE</span>
          <span className="node__kv-value">{data.metadata.qty}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
};