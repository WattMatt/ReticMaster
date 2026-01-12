import { GoogleGenAI, Type } from "@google/genai";
import { Node, Edge, SimulationResult } from "../types";
import { SANS_CONDUCTORS, SANS_TRANSFORMER_IMPEDANCE } from "../constants";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeNetwork = async (nodes: Node[], edges: Edge[]): Promise<SimulationResult> => {
  const ai = getAI();

  // Construct a physics-rich topology description
  const topologyDescription = JSON.stringify({
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      name: n.data.name,
      nominal_kV: n.data.voltage,
      // Electrical properties
      rating_kVA: n.data.rating,
      source_fault_kA: n.data.faultLevel3Ph,
      transformer_Z_percent: n.data.zPercent,
      tap_position: n.data.tapPosition, // -5 to +5, where 0 is nominal
      load_pf: n.data.powerFactor,
      load_scale_factor: n.data.loadScaleFactor
    })),
    connections: edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      length_m: e.length,
      conductor: e.conductorType
    }))
  });

  const sansContext = JSON.stringify({
    conductors: SANS_CONDUCTORS,
    standard_transformer_impedance: SANS_TRANSFORMER_IMPEDANCE
  });

  const prompt = `
    You are ReticMaster's core calculation engine. You must perform a static electrical network analysis.
    
    INPUT DATA:
    Topology: ${topologyDescription}
    SANS Library: ${sansContext}
    
    CALCULATION RULES:
    1. **Source Impedance**: If a SOURCE node has 'source_fault_kA', calculate Z_source (Ohms) = (Voltage_LL / sqrt(3)) / (Fault_kA * 1000). If not provided, assume Infinite Bus (0 impedance).
    2. **Transformer Model**: 
       - Use 'transformer_Z_percent' from the node data. If missing, look up 'rating_kVA' in SANS table.
       - Z_transformer_ohms_referenced_to_secondary = (Z% / 100) * (V_secondary^2 / Rating_MVA).
       - **Tap Changes**: If 'tap_position' is present (range -5 to 5), adjust the secondary voltage output. V_secondary_actual = V_secondary_nominal * (1 + (tap_position * 0.025)). Assume 2.5% per tap step. Positive taps increase secondary voltage.
    3. **Line Model**: 
       - Look up R and X per km from SANS Library.
       - Z_line = (R + jX) * (Length_m / 1000).
    4. **Load Flow**:
       - Apply 'load_scale_factor' to all loads. Actual kVA = rating_kVA * load_scale_factor.
       - Calculate approximate voltage drop: V_drop = I * (R*cos(phi) + X*sin(phi)).
       - Assume downstream nodes inherit voltage level from upstream unless a transformer is present.
    5. **Fault Analysis**:
       - Calculate 3-Phase Fault Current at EACH node: I_fault = V_phase / Total_Z_upstream.
       - Accumulate impedance from Source -> Transformers -> Lines.
    
    OUTPUT REQUIREMENTS:
    Return a JSON object matching the schema exactly.
    - 'edgeAnalysis' must include 'voltageDrop' (percentage of nominal voltage) and 'current' (Amps).
    - 'edgeAnalysis' status should be 'OVERLOAD' if current > maxCurrent in SANS table, else 'NORMAL'.
    - 'alerts' should list specific violations (e.g., "Node N5 Voltage under 95%", "Cable C1 Overloaded 120%").
    
    Output Schema:
    {
      "voltageProfile": [{"distance": number, "voltage": number (p.u.), "nodeName": string}],
      "faultCurrents": [{"nodeName": string, "currentKA": number, "type": "3-Phase"}],
      "edgeAnalysis": [{"edgeId": string, "voltageDrop": number, "current": number, "status": "NORMAL" | "OVERLOAD"}],
      "nodeResults": { [nodeName]: { "voltagePu": number, "voltageAngle": number, "loadKVA": number } },
      "alerts": [string],
      "summary": string
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            voltageProfile: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  distance: { type: Type.NUMBER },
                  voltage: { type: Type.NUMBER },
                  nodeName: { type: Type.STRING }
                }
              }
            },
            faultCurrents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nodeName: { type: Type.STRING },
                  currentKA: { type: Type.NUMBER },
                  type: { type: Type.STRING }
                }
              }
            },
            edgeAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  edgeId: { type: Type.STRING },
                  voltageDrop: { type: Type.NUMBER },
                  current: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ["NORMAL", "OVERLOAD"] }
                }
              }
            },
            nodeResults: {
               type: Type.OBJECT,
               description: "Map of node names to their result data",
               nullable: true
            },
            alerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Post-process to ensure nodeResults is robust even if AI hallucinates format
    const parsed = JSON.parse(text);
    if (!parsed.nodeResults) parsed.nodeResults = {};
    
    return parsed as SimulationResult;

  } catch (error) {
    console.error("Simulation Failed:", error);
    return {
      voltageProfile: [],
      faultCurrents: [],
      edgeAnalysis: [],
      nodeResults: {},
      alerts: ["Simulation engine error. Please verify network connectivity."],
      summary: "Critical error in calculation engine."
    };
  }
};