import React from 'react';
import { SimulationResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AnalysisPanelProps {
  result: SimulationResult | null;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
        <div>
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>Run an analysis to see voltage profiles and fault currents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 bg-slate-50">
      
      {/* Alerts Section */}
      {result.alerts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="ml-2 font-bold text-amber-700">Validation Alerts</p>
          </div>
          <ul className="mt-2 text-sm text-amber-800 list-disc list-inside">
            {result.alerts.map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600"/> 
            Executive Summary
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
      </div>

      {/* Voltage Profile Chart */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Voltage Profile (p.u.)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.voltageProfile}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nodeName" tick={{fontSize: 10}} />
              <YAxis domain={[0.8, 1.05]} label={{ value: 'Per Unit (p.u.)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="voltage" stroke="#0ea5e9" strokeWidth={2} name="Voltage" dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fault Current Chart */}
      <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">3-Phase Fault Levels (kA)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.faultCurrents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nodeName" tick={{fontSize: 10}} />
              <YAxis label={{ value: 'Current (kA)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="currentKA" fill="#ef4444" name="Fault Current (kA)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;