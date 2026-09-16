import React from 'react';
import { PredictionItem } from '../../types';
import { HelpCircle } from 'lucide-react';

interface ProbabilityBarsProps {
  predictions: PredictionItem[];
  primaryPrediction: string;
  calibrated?: boolean;
  temperature?: number;
}

export const ProbabilityBars: React.FC<ProbabilityBarsProps> = ({
  predictions,
  primaryPrediction,
  calibrated = true,
  temperature = 1.18,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>AI Diagnostic Findings</span>
            {calibrated && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                Calibrated (T={temperature})
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated posterior probabilities with 95% Bayesian credible intervals
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Top Prediction</span>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {primaryPrediction}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {predictions.map((item) => {
          const isPrimary = item.label.startsWith(primaryPrediction);
          const percent = Math.round(item.probability * 1000) / 10;
          const ciLowerPct = Math.round(item.ciLower * 1000) / 10;
          const ciUpperPct = Math.round(item.ciUpper * 1000) / 10;

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isPrimary ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                  {item.label}
                </span>

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[11px] text-slate-400">
                    95% CI: [{ciLowerPct}% - {ciUpperPct}%]
                  </span>
                  <span className={`font-bold ${isPrimary ? 'text-clinical-700 text-sm' : 'text-slate-800'}`}>
                    {percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar with Credible Interval overlay */}
              <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPrimary ? 'bg-clinical-600' : 'bg-slate-400'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          Credible intervals estimated via 25 stochastic MC-Dropout passes.
        </span>
        <span className="font-mono text-[10px] text-slate-400">Softmax + Platt Scaling</span>
      </div>
    </div>
  );
};
