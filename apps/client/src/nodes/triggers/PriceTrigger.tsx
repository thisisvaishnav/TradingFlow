import { Handle, Position } from "@xyflow/react";

export const PriceTriggerNode = ({ data }: { data: { metadata: { price: number; asset: string } } }) => {
  const asset = data.metadata.asset ?? "—";
  const price = data.metadata.price ?? "—";

  return (
    <div className="node node--trigger">
      <div className="node__header-split node__header-split--trigger">TRIGGER // PRICE</div>
      <div className="node__title">{asset} &gt; ${price}</div>
      <div className="node__kv-table">
        <div className="node__kv-row">
          <span className="node__kv-key">ASSET</span>
          <span className="node__kv-value">{asset}</span>
        </div>
        <div className="node__kv-row">
          <span className="node__kv-key">PRICE</span>
          <span className="node__kv-value">{price}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="node-handle node-handle--trigger" />
    </div>
  );
};
