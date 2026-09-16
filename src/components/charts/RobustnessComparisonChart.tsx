import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { HospitalCohort } from '../../types';

interface RobustnessComparisonChartProps {
  hospitals: HospitalCohort[];
}

export const RobustnessComparisonChart: React.FC<RobustnessComparisonChartProps> = ({ hospitals }) => {
  const chartData = hospitals.map((h) => ({
    name: h.code,
    fullName: h.name,
    accuracy: Math.round(h.accuracy * 1000) / 10,
    auroc: Math.round(h.auroc * 1000) / 10,
    ece: Math.round(h.ece * 1000) / 10,
    shift: h.shiftType,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={{ value: 'Clinical Evaluation Site / Domain', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#475569' }}
          />
          <YAxis
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={{ value: 'Metric (%)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: '#475569' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const pt = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg border border-slate-800">
                    <div className="font-bold text-slate-100">{pt.fullName}</div>
                    <div className="text-[11px] text-amber-300 font-mono mb-2">Shift: {pt.shift}</div>
                    <div>Accuracy: <span className="font-mono font-bold text-sky-400">{pt.accuracy}%</span></div>
                    <div>AUROC: <span className="font-mono font-bold text-emerald-400">{pt.auroc}%</span></div>
                    <div>ECE (Calibration Error): <span className="font-mono font-bold text-rose-400">{pt.ece}%</span></div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
          />
          <Bar dataKey="accuracy" name="Classification Accuracy (%)" fill="#0284c7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="auroc" name="AUROC (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ece" name="Expected Calibration Error (ECE %)" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
