import React from 'react';

import { OODMetrics } from '../../types';

import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface OODPanelProps {
  ood: OODMetrics;
}

export const OODPanel: React.FC<OODPanelProps> = ({ ood }) => {
  const isOOD = ood.isOOD;
  const isBorderline = ood.status === 'Borderline Shift';

  // Visualization only — no production OOD threshold is configured.
  // The scale adapts to the observed Mahalanobis distance so large
  // values are not misleadingly compressed into a fixed 0–3 range.
  const maxScale = Math.max(
    3,
    ood.mahalanobisDistance * 1.1
  );

  const currentPct = Math.min(
    (ood.mahalanobisDistance / maxScale) * 100,
    100
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft-sm">

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>Distributional Familiarity</span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Mahalanobis Feature-Space
            </span>
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            Detects hospital domain shift, scanner discrepancies, or foreign artifacts
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
            isOOD
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : isBorderline
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {isOOD ? (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          ) : isBorderline ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          )}

          <span>{ood.status}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-xs font-semibold text-slate-600 block mb-1">
            Observed Mahalanobis Distance M(x)
          </span>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isOOD ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {ood.mahalanobisDistance.toFixed(2)}
            </span>

            <span className="text-xs text-slate-500 font-mono">
              {isOOD ? '(Potential OOD)' : '(Observed Distance)'}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <span className="text-xs font-semibold text-slate-600 block mb-1">
            OOD Threshold
          </span>

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold font-mono text-slate-600">
              Not configured
            </span>
          </div>
        </div>

      </div>

      {/* Visual Mahalanobis Distance Scale */}
      <div className="mb-4">

        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
          <span>Feature Geometry Distance Meter</span>

          <span className="font-mono text-[11px] text-slate-500">
            Distance: {ood.mahalanobisDistance.toFixed(2)}
          </span>
        </div>

        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">

          {/* Visualization only — no threshold-based safe/OOD zones */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-slate-200/70"
            style={{ width: '100%' }}
          />

          {/* Current sample distance */}
          <div
            className={`relative h-full rounded-full transition-all duration-700 ${
              isOOD
                ? 'bg-rose-600 shadow-sm'
                : isBorderline
                ? 'bg-amber-500 shadow-sm'
                : 'bg-emerald-600 shadow-sm'
            }`}
            style={{ width: `${currentPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-0.5">
          <span>0.0</span>

          <span>Observed Mahalanobis distance</span>

          <span>{maxScale.toFixed(1)}+</span>
        </div>

      </div>

      {/* Educational Clinical Rationale */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">

        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />

        <div>
          <span className="font-semibold text-slate-800">
            Why this matters:{' '}
          </span>

          High OOD scores indicate that the image representation differs
          substantially from the training distribution (e.g., cross-hospital
          scanner hardware, contrast drift, pediatric anatomy, or foreign
          implants). ClinSure flags these unfamiliar cases so the model does not
          produce misleading high-confidence predictions.
        </div>

      </div>

    </div>
  );
};