import React from 'react';
import { TOOLS, SANS_CONDUCTORS, SANS_TRANSFORMER_IMPEDANCE } from '../constants';
import { ToolMode, Node, Edge, NodeType } from '../types';
import { Settings, Save, Upload, Activity, Zap, AlertCircle } from 'lucide-react';

interface SidebarProps {
  activeTool: ToolMode;
  setActiveTool: (t: ToolMode) => void;
  selectedNode: Node | null;
  updateNode: (id: string, data: any) => void;
  selectedEdge: Edge | null;
  updateEdge: (id: string, data: Partial<Edge>) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTool, 
  setActiveTool, 
  selectedNode, 
  updateNode,
  selectedEdge,
  updateEdge,
  onRunAnalysis,
  isAnalyzing
}) => {
  return (
    <div className="w-72 bg-slate-900 text-white flex flex-col border-r border-slate-700 h-screen shadow-2xl z-20">
      <div className="p-4 border-b border-slate-700 bg-slate-950">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <div className="bg-brand-600 p-1 rounded text-white">
             <Activity size={18} />
          </div>
          ReticMaster
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Network Analysis V2.0</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-brand-500 rounded-full"></span> Toolbox
        </h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as ToolMode)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all duration-200 border ${
                activeTool === tool.id
                  ? 'bg-brand-600/20 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'
              }`}
            >
              <tool.icon size={18} className="mb-1.5" />
              <span className="font-medium text-[10px]">{tool.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h2 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2">
            <Settings size={12} /> Properties
          </h2>
          
          {selectedNode ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
               <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-xs font-bold text-brand-400 uppercase flex items-center gap-2">
                    <Settings size={12} />
                    {selectedNode.type} Node
                  </span>
               </div>

               {/* General Properties */}
              <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</label>
                    <input
                    type="text"
                    value={selectedNode.data.name}
                    onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nominal Voltage (kV)</label>
                    <input
                    type="number"
                    value={selectedNode.data.voltage}
                    onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, voltage: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none transition-colors"
                    />
                </div>
              </div>

              {/* Source Specific */}
              {selectedNode.type === NodeType.SOURCE && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-brand-300 font-bold uppercase">Fault Parameters</p>
                    <div>
                        <label className="text-[10px] text-slate-400">3-Phase Fault Level (kA)</label>
                        <input
                        type="number"
                        value={selectedNode.data.faultLevel3Ph || 15}
                        onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, faultLevel3Ph: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400">X/R Ratio</label>
                        <input
                        type="number"
                        value={selectedNode.data.xrRatio || 10}
                        onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, xrRatio: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                  </div>
              )}

              {/* Transformer Specific */}
              {selectedNode.type === NodeType.TRANSFORMER && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-brand-300 font-bold uppercase">Transformer Specs</p>
                    <div>
                        <label className="text-[10px] text-slate-400">Rating (kVA)</label>
                        <input
                        type="number"
                        value={selectedNode.data.rating || 100}
                        onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, rating: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-slate-400">Impedance (%Z)</label>
                            <input
                            type="number"
                            step="0.01"
                            value={selectedNode.data.zPercent || 4.5}
                            onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, zPercent: parseFloat(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400">Vector Grp</label>
                            <input
                            type="text"
                            placeholder="Dyn11"
                            value={selectedNode.data.vectorGroup || "Dyn11"}
                            onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, vectorGroup: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                            />
                        </div>
                    </div>
                    
                    {/* Enhanced Tap Position Control */}
                    <div className="pt-1">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] text-slate-400">Tap Position</label>
                            <span className={`text-[10px] font-mono font-bold ${
                                (selectedNode.data.tapPosition || 0) > 0 ? 'text-green-400' : 
                                (selectedNode.data.tapPosition || 0) < 0 ? 'text-red-400' : 'text-slate-300'
                            }`}>
                                {selectedNode.data.tapPosition && selectedNode.data.tapPosition > 0 ? '+' : ''}
                                {selectedNode.data.tapPosition || 0}
                                <span className="text-slate-500 ml-1 font-normal">
                                    ({((selectedNode.data.tapPosition || 0) * 2.5).toFixed(1)}%)
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => updateNode(selectedNode.id, { ...selectedNode.data, tapPosition: Math.max(-5, (selectedNode.data.tapPosition || 0) - 1) })}
                                className="w-6 h-6 flex items-center justify-center bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-300 transition-colors active:bg-slate-600"
                            >-</button>
                            <input
                                type="range"
                                min="-5"
                                max="5"
                                step="1"
                                value={selectedNode.data.tapPosition || 0}
                                onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, tapPosition: parseFloat(e.target.value) })}
                                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                            <button 
                                onClick={() => updateNode(selectedNode.id, { ...selectedNode.data, tapPosition: Math.min(5, (selectedNode.data.tapPosition || 0) + 1) })}
                                className="w-6 h-6 flex items-center justify-center bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-300 transition-colors active:bg-slate-600"
                            >+</button>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-600 px-1 mt-1">
                            <span>-5</span>
                            <span>0</span>
                            <span>+5</span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 text-center italic">
                            Calculated at ±2.5% per tap
                        </p>
                    </div>
                  </div>
              )}

              {/* Load Specific */}
              {selectedNode.type === NodeType.LOAD && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-brand-300 font-bold uppercase">Load Parameters</p>
                    <div>
                        <label className="text-[10px] text-slate-400">Rating (kVA)</label>
                        <input
                        type="number"
                        value={selectedNode.data.rating || 0}
                        onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, rating: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-slate-400">Power Factor</label>
                            <input
                            type="number"
                            step="0.01"
                            max="1.0"
                            min="0.0"
                            value={selectedNode.data.powerFactor || 0.9}
                            onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, powerFactor: parseFloat(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400">Scale Factor</label>
                            <input
                            type="number"
                            step="0.1"
                            value={selectedNode.data.loadScaleFactor || 1.0}
                            onChange={(e) => updateNode(selectedNode.id, { ...selectedNode.data, loadScaleFactor: parseFloat(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm"
                            />
                        </div>
                    </div>
                  </div>
              )}
            </div>
          ) : selectedEdge ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-400"/>
                  <span className="text-xs font-bold text-yellow-400 uppercase">Conductor</span>
               </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Length (meters)</label>
                <input
                  type="number"
                  value={selectedEdge.length}
                  onChange={(e) => updateEdge(selectedEdge.id, { length: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type (SANS)</label>
                <select
                  value={selectedEdge.conductorType}
                  onChange={(e) => updateEdge(selectedEdge.id, { conductorType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm focus:border-brand-500 outline-none"
                >
                    {Object.keys(SANS_CONDUCTORS).map(key => (
                        <option key={key} value={key}>{key}</option>
                    ))}
                </select>
                {SANS_CONDUCTORS[selectedEdge.conductorType] && (
                   <div className="text-[10px] text-slate-500 mt-1 flex justify-end">
                       Max Capacity: <span className="text-brand-400 font-mono ml-1">{SANS_CONDUCTORS[selectedEdge.conductorType].maxCurrent} A</span>
                   </div>
                )}
              </div>
              
              {SANS_CONDUCTORS[selectedEdge.conductorType] && (
                  <div className="text-[10px] text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-700 space-y-2 mt-2">
                      <div className="flex justify-between border-b border-slate-700 pb-1">
                          <span>Type</span>
                          <span className="text-white font-mono">{SANS_CONDUCTORS[selectedEdge.conductorType].type}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Resistance (R)</span>
                          <span className="text-white font-mono">{SANS_CONDUCTORS[selectedEdge.conductorType].r} Ω/km</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Reactance (X)</span>
                          <span className="text-white font-mono">{SANS_CONDUCTORS[selectedEdge.conductorType].x} Ω/km</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-1">
                          <span>Max Current</span>
                          <span className="text-white font-mono">{SANS_CONDUCTORS[selectedEdge.conductorType].maxCurrent} A</span>
                      </div>
                  </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-center p-4 border border-slate-800 rounded-lg bg-slate-900/50 border-dashed">
                <AlertCircle size={24} className="mb-2 opacity-50"/>
                <p className="text-xs">Select a Node or Line to edit parameters.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-950">
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded shadow-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Solving...
            </>
          ) : (
            <>
              <Activity size={16} />
              Calculate
            </>
          )}
        </button>
        <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors">
                <Save size={12} /> Project
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors">
                <Upload size={12} /> Load Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;