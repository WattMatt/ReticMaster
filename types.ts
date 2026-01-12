export enum NodeType {
  SOURCE = 'SOURCE',
  TRANSFORMER = 'TRANSFORMER',
  BUSBAR = 'BUSBAR',
  LOAD = 'LOAD',
  TEXT = 'TEXT'
}

export interface NodeData {
  name: string;
  voltage: number; // kV
  
  // Common
  rating?: number; // kVA (Transformer, Load)
  
  // Source Specific
  faultLevel3Ph?: number; // kA
  xrRatio?: number; // X/R Ratio
  
  // Transformer Specific
  zPercent?: number; // Impedance %
  tapPosition?: number; // e.g., 1 (Normal), range usually +/-
  vectorGroup?: string; // e.g., Dyn11
  
  // Load Specific
  powerFactor?: number; // 0.0 to 1.0
  loadScaleFactor?: number; // Multiplier, default 1.0
}

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  length: number; // meters
  conductorType: string;
  voltageDrop?: number; // percentage
}

export interface SimulationResult {
  voltageProfile: { distance: number; voltage: number; nodeName: string }[];
  faultCurrents: { nodeName: string; currentKA: number; type: string }[];
  edgeAnalysis: { edgeId: string; voltageDrop: number; current: number; status: 'NORMAL' | 'OVERLOAD' }[];
  nodeResults: Record<string, { voltagePu: number; voltageAngle: number; loadKVA: number }>;
  alerts: string[];
  summary: string;
}

export type ToolMode = 'SELECT' | 'CONNECT' | NodeType;