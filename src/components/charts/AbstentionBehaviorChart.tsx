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

interface AbstentionBehaviorChartProps {
  data: {
    cohort: string;
    accept: number;
    uncertain: number;
    abstain: number;
  }[];
}

export const AbstentionBehaviorChart: React.FC<AbstentionBehaviorChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, bottom: 20, left: 110 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            unit="%"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={{ value: 'Triage Allocation Percentage (%)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#475569' }}
          />
          <YAxis
            type="category"
            dataKey="cohort"
            tick={{ fontSize: 11, fill: '#334155' }}
            width={120}
          />
          <Tooltip
            formatter={(val: number) => [`${val}%`, '']}
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
          />
          <Bar dataKey="accept" name="ACCEPT (Automated)" stackId="a" fill="#10b981" />
          <Bar dataKey="uncertain" name="UNCERTAIN (Review)" stackId="a" fill="#f59e0b" />
          <Bar dataKey="abstain" name="ABSTAIN (Withheld/OOD)" stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
