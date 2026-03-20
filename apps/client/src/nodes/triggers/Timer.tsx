import { Handle, Position } from "@xyflow/react";

export const TimerNode = ({ data }: { data: { metadata: { time: number } } }) => {
  const time = data.metadata.time ?? "—";

  return (
    <div className="node node--trigger">
      <div className="node__header-split node__header-split--trigger">TRIGGER // TIMER</div>
      <div className="node__title">Every {time}s</div>
      <div className="node__kv-table">
        <div className="node__kv-row">
          <span className="node__kv-key">INTERVAL</span>
          <span className="node__kv-value">{time}s</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="node-handle node-handle--trigger" />
    </div>
  );
};