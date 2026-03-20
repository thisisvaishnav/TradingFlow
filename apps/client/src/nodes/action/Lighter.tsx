import { Handle, Position } from "@xyflow/react";
import type { LighterTradingMetadata } from "common/types";

export const Lighter = ({ data }: { data: { metadata: LighterTradingMetadata } }) => {
  const hasKeys = !!data.metadata.lighterPrivateKey;

  return (
    <div className="node node--action" style={{ position: "relative" }}>
      <div className="node__header-split" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>ACTION // LIGHTER</span>
        {hasKeys && (
          <span style={{
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "1px 4px",
            background: "var(--trade-long)",
            color: "var(--bg-base)",
            borderRadius: 2,
            marginLeft: 6,
          }}>
            Keys Set
          </span>
        )}
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
        <div className="node__kv-row">
          <span className="node__kv-key">ACCT</span>
          <span className="node__kv-value">{data.metadata.lighterAccountIndex ?? "—"}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
};
