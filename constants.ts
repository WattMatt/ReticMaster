import { NodeType } from "./types";
import { Zap, Box, Minus, ArrowDown, MousePointer2, Link as LinkIcon } from 'lucide-react';

export const TOOLS = [
  { id: 'SELECT', label: 'Select', icon: MousePointer2, type: 'mode' },
  { id: 'CONNECT', label: 'Connect', icon: LinkIcon, type: 'mode' },
  { id: NodeType.SOURCE, label: 'Source', icon: Zap, type: 'node' },
  { id: NodeType.TRANSFORMER, label: 'Transformer', icon: Box, type: 'node' },
  { id: NodeType.BUSBAR, label: 'Busbar', icon: Minus, type: 'node' },
  { id: NodeType.LOAD, label: 'Load', icon: ArrowDown, type: 'node' },
];

export const DEFAULT_VOLTAGE = 11; // 11kV

// SANS Standard Conductor Data (Resistance and Reactance in Ohms/km)
export const SANS_CONDUCTORS: Record<string, { r: number; x: number; maxCurrent: number; type: string }> = {
  'Hare': { r: 0.5426, x: 0.359, maxCurrent: 130, type: 'ACSR' },
  'Mink': { r: 0.273, x: 0.336, maxCurrent: 180, type: 'ACSR' },
  'Rabbit': { r: 0.5426, x: 0.359, maxCurrent: 125, type: 'ACSR' },
  'Dog': { r: 0.2733, x: 0.33, maxCurrent: 210, type: 'ACSR' },
  'Wolf': { r: 0.1828, x: 0.32, maxCurrent: 265, type: 'ACSR' },
  'ABC 50mm': { r: 0.72, x: 0.1, maxCurrent: 140, type: 'LV ABC' },
  'ABC 95mm': { r: 0.32, x: 0.09, maxCurrent: 215, type: 'LV ABC' },
  'PVC 16mm Cu': { r: 1.15, x: 0.1, maxCurrent: 80, type: 'Cable' },
  'PVC 70mm Cu': { r: 0.268, x: 0.09, maxCurrent: 200, type: 'Cable' },
  'PILC 185mm Cu': { r: 0.099, x: 0.08, maxCurrent: 380, type: 'Cable' },
};

// Transformer Impedance (%Z) - Expanded for larger units often used in ReticMaster
export const SANS_TRANSFORMER_IMPEDANCE: Record<number, number> = {
    16: 4.0,
    25: 4.0,
    50: 4.0,
    100: 4.5,
    200: 4.5,
    315: 4.5,
    500: 4.5,
    630: 4.5,
    800: 5.0,
    1000: 5.0,
    1250: 5.0,
    1600: 6.0,
    2000: 6.0,
    // Power Transformers (Typical values)
    2500: 6.25,
    5000: 7.0,
    10000: 8.0,
    20000: 10.0, // 20MVA
    40000: 12.5
};