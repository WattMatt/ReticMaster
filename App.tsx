import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import AnalysisPanel from './components/AnalysisPanel';
import { Node, Edge, ToolMode, SimulationResult, NodeType } from './types';
import { analyzeNetwork } from './services/geminiService';

// Demo Data matching ReticMaster Manual "Demo 1"
const INITIAL_NODES: Node[] = [
  // 132kV Source Section
  { id: 'n1', type: NodeType.SOURCE, x: 100, y: 300, data: { name: 'Main_Source', voltage: 132, faultLevel3Ph: 20, xrRatio: 10 } },
  { id: 'n2', type: NodeType.BUSBAR, x: 250, y: 300, data: { name: 'HV1', voltage: 132 } },
  { id: 'n3', type: NodeType.BUSBAR, x: 400, y: 300, data: { name: 'HV2', voltage: 132 } },
  
  // 20MVA Transformer 132/11kV
  { id: 'n4', type: NodeType.TRANSFORMER, x: 550, y: 300, data: { name: 'Tx_01', voltage: 11, rating: 20000, zPercent: 11.25, vectorGroup: 'Dyn11' } },
  
  // 11kV Distribution
  { id: 'n5', type: NodeType.BUSBAR, x: 700, y: 300, data: { name: 'MV1', voltage: 11 } },
  { id: 'n6', type: NodeType.LOAD, x: 700, y: 450, data: { name: 'Load_A', voltage: 11, rating: 3000, powerFactor: 0.85, loadScaleFactor: 1.0 } },
  { id: 'n7', type: NodeType.LOAD, x: 850, y: 300, data: { name: 'Load_B', voltage: 11, rating: 3000, powerFactor: 0.85 } },
];

const INITIAL_EDGES: Edge[] = [
  // 132kV Wolf Lines
  { id: 'e1', from: 'n1', to: 'n2', length: 10000, conductorType: 'Wolf' },
  { id: 'e2', from: 'n2', to: 'n3', length: 10000, conductorType: 'Wolf' },
  { id: 'e3', from: 'n3', to: 'n4', length: 50, conductorType: 'Wolf' }, // Jumper to Tx
  
  // 11kV Hare Lines
  { id: 'e4', from: 'n4', to: 'n5', length: 50, conductorType: 'Hare' },
  { id: 'e5', from: 'n5', to: 'n6', length: 1000, conductorType: 'Hare' },
  { id: 'e6', from: 'n5', to: 'n7', length: 1000, conductorType: 'Hare' },
];

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [activeTool, setActiveTool] = useState<ToolMode>('SELECT');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpdateNode = (id: string, data: any) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, data } : n));
  };

  const handleUpdateEdge = (id: string, data: Partial<Edge>) => {
    setEdges(edges.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeNetwork(nodes, edges);
      setSimulationResult(result);
      
      // Update edges with calculated voltage drops from the engine
      if (result.edgeAnalysis) {
        setEdges(prevEdges => prevEdges.map(edge => {
            const analysis = result.edgeAnalysis.find(ea => ea.edgeId === edge.id);
            return analysis ? { ...edge, voltageDrop: analysis.voltageDrop } : edge;
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null;

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedNode={selectedNode}
        updateNode={handleUpdateNode}
        selectedEdge={selectedEdge}
        updateEdge={handleUpdateEdge}
        onRunAnalysis={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
      />
      
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toolbar / Top Bar could go here if needed */}
        
        <div className="flex-1 relative border-b border-slate-200 shadow-inner">
            <Canvas
                nodes={nodes}
                edges={edges}
                setNodes={setNodes}
                setEdges={setEdges}
                activeTool={activeTool}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                selectedEdgeId={selectedEdgeId}
                setSelectedEdgeId={setSelectedEdgeId}
            />
        </div>
        
        <div className="h-80 bg-white z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <AnalysisPanel result={simulationResult} />
        </div>
      </div>
    </div>
  );
};

export default App;