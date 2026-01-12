import React, { useState, useRef } from 'react';
import { Node, Edge, ToolMode, NodeType } from '../types';
import { SANS_CONDUCTORS } from '../constants';
import { Zap, ArrowDown, Box, Minus } from 'lucide-react';

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  activeTool: ToolMode;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
}

const GRID_SIZE = 20;

const NodeIcon = ({ type, size = 24, color = "currentColor" }: { type: NodeType, size?: number, color?: string }) => {
  switch (type) {
    case NodeType.SOURCE: return <Zap size={size} color={color} fill={color} className="bg-white rounded-full" />;
    case NodeType.TRANSFORMER: return <Box size={size} color={color} className="bg-white" />;
    case NodeType.LOAD: return <ArrowDown size={size} color={color} strokeWidth={2.5} />;
    case NodeType.BUSBAR: return <Minus size={size} color={color} />;
    default: return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
  }
};

const distToSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  edges, 
  setNodes, 
  setEdges, 
  activeTool, 
  selectedNodeId, 
  setSelectedNodeId,
  selectedEdgeId,
  setSelectedEdgeId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{ x: number, y: number, id: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

  const getMousePos = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    // Check if clicked on a node
    const clickedNode = nodes.find(n => Math.abs(n.x - x) < 20 && Math.abs(n.y - y) < 20);

    if (clickedNode) {
      setSelectedNodeId(clickedNode.id);
      setSelectedEdgeId(null);
      if (activeTool === 'SELECT') {
        setDragNode(clickedNode.id);
      } else if (activeTool === 'CONNECT') {
        setConnectionStart({ x: clickedNode.x, y: clickedNode.y, id: clickedNode.id });
      }
    } else {
      // Check if clicked on an edge
      const clickedEdge = edges.find(edge => {
        const start = nodes.find(n => n.id === edge.from);
        const end = nodes.find(n => n.id === edge.to);
        if (!start || !end) return false;
        return distToSegment({x, y}, start, end) < 10;
      });

      if (clickedEdge && activeTool === 'SELECT') {
          setSelectedEdgeId(clickedEdge.id);
          setSelectedNodeId(null);
      } else {
          // Background click
          setSelectedNodeId(null);
          setSelectedEdgeId(null);

          if (activeTool !== 'SELECT' && activeTool !== 'CONNECT') {
            // Add new node
            const newNode: Node = {
              id: `n_${Date.now()}`,
              type: activeTool as NodeType,
              x: snappedX,
              y: snappedY,
              data: {
                name: `${activeTool}_${nodes.length + 1}`,
                voltage: 11,
                rating: activeTool === NodeType.TRANSFORMER || activeTool === NodeType.LOAD ? 100 : undefined,
                // Set defaults based on manual
                faultLevel3Ph: activeTool === NodeType.SOURCE ? 15 : undefined,
                zPercent: activeTool === NodeType.TRANSFORMER ? 4.5 : undefined
              }
            };
            setNodes(prev => [...prev, newNode]);
          }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);
    setMousePos({ x, y });

    if (dragNode) {
      setNodes(prev => prev.map(n => {
        if (n.id === dragNode) {
          return { 
            ...n, 
            x: Math.round(x / GRID_SIZE) * GRID_SIZE, 
            y: Math.round(y / GRID_SIZE) * GRID_SIZE 
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (connectionStart) {
      const { x, y } = getMousePos(e);
      const targetNode = nodes.find(n => Math.abs(n.x - x) < 20 && Math.abs(n.y - y) < 20);

      if (targetNode && targetNode.id !== connectionStart.id) {
        const exists = edges.some(edge => 
          (edge.from === connectionStart.id && edge.to === targetNode.id) ||
          (edge.to === connectionStart.id && edge.from === targetNode.id)
        );

        if (!exists) {
          const newEdge: Edge = {
            id: `e_${Date.now()}`,
            from: connectionStart.id,
            to: targetNode.id,
            length: 100,
            conductorType: 'Mink' // Default SANS conductor
          };
          setEdges(prev => [...prev, newEdge]);
        }
      }
    }
    setDragNode(null);
    setConnectionStart(null);
  };

  return (
    <div className="w-full h-full bg-slate-50 overflow-hidden relative bg-grid">
      <div className="absolute top-2 left-2 bg-white/90 border border-slate-200 shadow-sm px-3 py-1.5 rounded text-xs font-mono text-slate-600 pointer-events-none z-10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${activeTool === 'CONNECT' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
        Mode: {activeTool} {activeTool === 'CONNECT' && connectionStart && '(Drag to connect)'}
      </div>
      
      <svg
        ref={svgRef}
        className="w-full h-full touch-none cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="15" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        {/* Connections */}
        {edges.map(edge => {
          const start = nodes.find(n => n.id === edge.from);
          const end = nodes.find(n => n.id === edge.to);
          if (!start || !end) return null;
          
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const hasDrop = edge.voltageDrop !== undefined;
          const isSelected = selectedEdgeId === edge.id;

          // Determine edge color based on voltage drop
          let edgeColor = "#64748b"; // Default slate-500
          if (hasDrop) {
             if (edge.voltageDrop! > 5) {
                 edgeColor = "#ef4444"; // Red-500
             } else if (edge.voltageDrop! > 2) {
                 edgeColor = "#f97316"; // Orange-500
             }
          }

          const finalStroke = isSelected ? "#0ea5e9" : edgeColor;
          const strokeWidth = isSelected ? "3" : (hasDrop && edge.voltageDrop! > 2 ? "3" : "2");

          return (
            <g key={edge.id} className="group">
              {/* Interaction Area (Invisible thicker line) */}
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="transparent"
                strokeWidth="20"
              />
              {/* Visible Line */}
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={finalStroke}
                strokeWidth={strokeWidth}
                strokeDasharray={isSelected ? "5,2" : ""}
                className="transition-all"
              />
              
              {/* Label Group */}
              <g className={isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"}>
                 <rect 
                    x={midX - 30} 
                    y={midY - (hasDrop ? 16 : 10)} 
                    width="60" 
                    height={hasDrop ? 32 : 20} 
                    rx="4"
                    fill="white"
                    stroke={finalStroke}
                    strokeWidth="1"
                    className="shadow-sm"
                 />
                 <text
                    x={midX}
                    y={midY - (hasDrop ? 4 : -4)}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="10"
                    fontWeight="500"
                    className="pointer-events-none select-none font-mono"
                 >
                    {edge.length}m
                 </text>
                 {hasDrop && (
                     <text
                        x={midX}
                        y={midY + 8}
                        textAnchor="middle"
                        fill={edge.voltageDrop! > 5 ? "#ef4444" : (edge.voltageDrop! > 2 ? "#f97316" : "#059669")}
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none select-none font-mono"
                     >
                        ΔV: {edge.voltageDrop!.toFixed(2)}%
                     </text>
                 )}
              </g>
            </g>
          );
        })}

        {/* Temporary Connection Line */}
        {connectionStart && mousePos && (
          <line
            x1={connectionStart.x}
            y1={connectionStart.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isSource = node.type === NodeType.SOURCE;
          const isBus = node.type === NodeType.BUSBAR;
          
          // Logic to determine node color and load status
          let nodeColor = isSource ? "#ef4444" : "#0f172a";
          let loadLabel = null;

          if (node.type === NodeType.LOAD && node.data.rating && node.data.voltage) {
              const feedingEdge = edges.find(e => e.to === node.id);
              if (feedingEdge) {
                  const conductor = SANS_CONDUCTORS[feedingEdge.conductorType];
                  if (conductor) {
                      const kVA = node.data.rating * (node.data.loadScaleFactor || 1.0);
                      // I = S / (sqrt(3) * V)
                      const amps = kVA / (Math.sqrt(3) * node.data.voltage);
                      const util = amps / conductor.maxCurrent;

                      if (util > 1.0) {
                          nodeColor = "#dc2626"; // Red 600
                          loadLabel = <text y={-22} textAnchor="middle" className="text-[9px] fill-red-600 font-bold pointer-events-none select-none">{(util * 100).toFixed(0)}% Load</text>;
                      } else if (util > 0.8) {
                          nodeColor = "#d97706"; // Amber 600
                          loadLabel = <text y={-22} textAnchor="middle" className="text-[9px] fill-amber-600 font-bold pointer-events-none select-none">{(util * 100).toFixed(0)}%</text>;
                      } else {
                          nodeColor = "#059669"; // Emerald 600
                      }
                  }
              }
          }

          return (
            <g 
              key={node.id} 
              transform={`translate(${node.x}, ${node.y})`}
              className={`${isSelected ? 'cursor-move' : 'cursor-pointer'}`}
            >
              {/* Selection Highlight */}
              {isSelected && (
                <circle r={isBus ? 15 : 28} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" />
              )}
              
              {/* Component Body */}
              {isBus ? (
                 <line x1="-20" y1="0" x2="20" y2="0" stroke={isSource ? "#ef4444" : "#0f172a"} strokeWidth="6" strokeLinecap="square" />
              ) : (
                 <foreignObject x="-15" y="-15" width="30" height="30" className="pointer-events-none">
                    <div className={`flex items-center justify-center w-full h-full drop-shadow-md`}>
                        <NodeIcon type={node.type} size={24} color={nodeColor} />
                    </div>
                 </foreignObject>
              )}

              {/* Extra Status Label for Loads */}
              {loadLabel}

              {/* Main Label */}
              <text 
                y={35} 
                textAnchor="middle" 
                className="text-[10px] fill-slate-800 font-bold pointer-events-none select-none bg-white/80"
              >
                {node.data.name}
              </text>
              <text 
                y={45} 
                textAnchor="middle" 
                className="text-[9px] fill-slate-500 pointer-events-none select-none"
              >
                {node.data.voltage}kV
              </text>
              
              {/* Dynamic labels based on type */}
              {node.type === NodeType.LOAD && node.data.rating && (
                <text y={55} textAnchor="middle" className="text-[9px] fill-slate-500 pointer-events-none select-none">
                    {node.data.rating}kVA
                </text>
              )}
              {node.type === NodeType.TRANSFORMER && node.data.rating && (
                <text y={55} textAnchor="middle" className="text-[9px] fill-slate-500 pointer-events-none select-none">
                    {node.data.rating}kVA {node.data.vectorGroup}
                </text>
              )}
              {node.type === NodeType.SOURCE && node.data.faultLevel3Ph && (
                <text y={55} textAnchor="middle" className="text-[9px] fill-red-500 pointer-events-none select-none">
                    {node.data.faultLevel3Ph}kA
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Canvas;