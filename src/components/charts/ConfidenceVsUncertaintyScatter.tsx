import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { Decision } from '../../types';

interface ScatterPoint {
  id: string;
  confidence: number;
  uncertainty: number;
  decision: Decision;
  prediction: string;
}

interface ConfidenceVsUncertaintyScatterProps {
  data: ScatterPoint[];
}

export const ConfidenceVsUncertaintyScatter: React.FC<ConfidenceVsUncertaintyScatterProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    x: Math.round(d.confidence * 100),
    y: Math.round(d.uncertainty * 100) / 100,
    decision: d.decision,
    prediction: d.prediction,
    id: d.id,
  }));

  const getColor = (decision: Decision) => {
    switch (decision) {
      case 'ACCEPT':
        return '#10b981'; // green
      case 'UNCERTAIN':
        return '#f59e0b'; // amber
      case 'ABSTAIN':
        return '#ef4444'; // red
    }
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Confidence"
            unit="%"
            domain={[50, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={{ value: 'Calibrated Confidence (%)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#475569' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Epistemic Uncertainty"
            domain={[0, 1.2]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={{ value: 'Epistemic Uncertainty I(y, W)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#475569' }}
          />
          {/* Reference line for uncertainty safety threshold */}
          <ReferenceLine y={0.35} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Uncertainty Limit (0.35)', fill: '#b45309', fontSize: 10 }} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pt = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-800">
                    <div className="font-bold text-slate-200 mb-1">{pt.prediction}</div>
                    <div>Confidence: <span className="font-mono font-bold text-sky-400">{pt.x}%</span></div>
                    <div>Epistemic Uncertainty: <span className="font-mono font-bold text-amber-400">{pt.y}</span></div>
                    <div className="mt-1 pt-1 border-t border-slate-800 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Triage:</span>
                      <span className={`font-bold uppercase text-[10px] ${
                        pt.decision === 'ACCEPT' ? 'text-emerald-400' : pt.decision === 'UNCERTAIN' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {pt.decision}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Cases" data={chartData}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.decision)} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
