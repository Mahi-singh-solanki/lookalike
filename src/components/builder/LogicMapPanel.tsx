import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GlassPanel } from "../common/GlassPanel";
import type { FormSchema } from "../../types/form";

interface LogicNodeData {
  [key: string]: unknown;
  label: string;
  linking: boolean;
  onStartLink: () => void;
}

const LogicNodeCard = ({ data }: NodeProps<Node<LogicNodeData>>) => {
  return (
    <div className="group relative min-w-[150px] rounded-xl border border-cyan-200/25 bg-slate-900/90 px-3 py-2 text-xs text-cyan-50">
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-cyan-300" />
      <div className="text-[10px] uppercase tracking-wide text-cyan-200/70">Field</div>
      <div className="mt-1 font-semibold">{data.label}</div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          data.onStartLink();
        }}
        className={`absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-cyan-200/50 bg-cyan-300/20 text-[12px] transition ${
          data.linking ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        title="Start link"
      >
        +
      </button>

      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-0 !bg-cyan-300" />
    </div>
  );
};

const initialPosition = (index: number) => ({ x: (index % 2) * 230, y: Math.floor(index / 2) * 130 });

export const LogicMapPanel = ({ schema, visible }: { schema: FormSchema; visible: boolean }) => {
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<LogicNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const fieldIds = new Set(schema.fields.map((field) => field.id));

    setNodes((prev) =>
      schema.fields.map((field, index) => {
        const existing = prev.find((node) => node.id === field.id);
        return {
          id: field.id,
          position: existing?.position ?? initialPosition(index),
          type: "logicNode",
          data: {
            label: field.label,
            linking: linkSource === field.id,
            onStartLink: () => setLinkSource(field.id),
          },
        };
      }),
    );

    setEdges((prev) => {
      const kept = prev.filter((edge) => fieldIds.has(edge.source) && fieldIds.has(edge.target));
      if (kept.length) return kept;
      return schema.fields.slice(1).map((field, index) => ({
        id: `e-${schema.fields[index].id}-${field.id}`,
        source: schema.fields[index].id,
        target: field.id,
        animated: true,
      }));
    });
  }, [schema.fields, setEdges, setNodes, linkSource]);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: {
          ...node.data,
          linking: linkSource === node.id,
          onStartLink: () => setLinkSource(node.id),
        },
      })),
    );
  }, [linkSource, setNodes]);

  const nodeTypes = useMemo(() => ({ logicNode: LogicNodeCard }), []);

  const onConnect = (connection: Connection) => {
    setEdges((prev) => addEdge({ ...connection, id: `e-${crypto.randomUUID()}`, animated: true }, prev));
  };

  if (!visible) return null;

  return (
    <motion.div drag dragMomentum={false} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-24 right-5 z-30 h-[340px] w-[420px]">
      <GlassPanel className="h-full overflow-hidden p-2">
        <div className="mb-2 flex cursor-grab items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 active:cursor-grabbing">
          <span>Logic Map</span>
          <span className="text-[10px] text-slate-400">Hover edge to cut, hover node for + link</span>
        </div>
        <div className={`h-[284px] rounded-2xl border border-white/10 ${hoveredEdge ? "cursor-crosshair" : "cursor-default"}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges.map((edge) =>
              edge.id === hoveredEdge
                ? { ...edge, style: { stroke: "#fb7185", strokeWidth: 2.5 }, animated: true }
                : { ...edge, style: { stroke: "#62d0ff", strokeWidth: 2 } },
            )}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              if (!linkSource || linkSource === node.id) return;
              setEdges((prev) => {
                const exists = prev.some((edge) => edge.source === linkSource && edge.target === node.id);
                if (exists) return prev;
                return [...prev, { id: `e-${crypto.randomUUID()}`, source: linkSource, target: node.id, animated: true }];
              });
              setLinkSource(null);
            }}
            onPaneClick={() => setLinkSource(null)}
            onEdgeMouseEnter={(_, edge) => setHoveredEdge(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdge(null)}
            onEdgeClick={(_, edge) => {
              setEdges((prev) => prev.filter((item) => item.id !== edge.id));
              setHoveredEdge(null);
            }}
          >
            <Background color="rgba(103, 180, 255, 0.3)" gap={18} />
            <Controls showInteractive />
          </ReactFlow>
        </div>
      </GlassPanel>
    </motion.div>
  );
};
