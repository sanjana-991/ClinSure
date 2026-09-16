import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface CalibrationBin {
  confidenceBin: string;
  predictedConfidence: number;
  observedAccuracy: number;
  count: number;
  perfectCalibration: number;
}

interface ReliabilityDiagramProps {
  data: CalibrationBin[];
  ece: number;
}

export const ReliabilityDiagram: React.FC<ReliabilityDiagramProps> = ({ data, ece }) => {
  const chartData = data.map((d) => ({
    bin: d.confidenceBin,
    predicted: Math.round(d.predictedConfidence * 100),
    observed: Math.round(d.observedAccuracy * 100),
    perfect: Math.round(d.perfectCalibration * 100),
    gap: Math.abs(Math.round((d.predictedConfidence - d.observedAccuracy) * 100)),
    count: d.count
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500">
          Evaluated across 10 confidence bins with Temperature Scaling (T=1.18)
        </div>
        <div className="px-2.5 py-1 rounded bg-sky-50 border border-sky-200 text-sky-800 text-xs font-mono font-bold">
          ECE = {(ece * 100).toFixed(2)}%
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="bin"
              tick={{ fontSize: 10, fill: '#64748b' }}
              label={{ value: 'Predicted Confidence Bin', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#475569' }}
            />
            <YAxis
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: '#64748b' }}
              label={{ value: 'Observed Empirical Accuracy', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#475569' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-800">
                      <div className="font-bold text-slate-200 mb-1">Bin: {label}</div>
                      <div>Observed Accuracy: <span className="font-mono font-bold text-emerald-400">{pt.observed}%</span></div>
                      <div>Predicted Confidence: <span className="font-mono font-bold text-sky-400">{pt.predicted}%</span></div>
                      <div>Calibration Gap: <span className="font-mono text-amber-400">{pt.gap}%</span></div>
                      <div className="text-[10px] text-slate-400 mt-1">Sample Count: {pt.count} radiographs</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={32}
              formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
            />

            {/* Model observed accuracy bars */}
            <Bar
              dataKey="observed"
              name="Model Accuracy"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />

            {/* Perfect calibration reference line */}
            <Line
              type="linear"
              dataKey="perfect"
              name="Perfect Calibration (y = x)"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
