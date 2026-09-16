import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface UncertaintyDistributionChartProps {
  data: { bin: string; count: number }[];
}

export const UncertaintyDistributionChart: React.FC<UncertaintyDistributionChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 9, fill: '#64748b' }}
            label={{ value: 'Epistemic Uncertainty I(y, W)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#475569' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            label={{ value: 'Frequency', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: '#475569' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="count" name="Case Count" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
