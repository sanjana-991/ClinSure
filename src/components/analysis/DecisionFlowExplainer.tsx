import React, { useState } from 'react';

import { Decision, DecisionFactor } from '../../types';

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Shield,
  Scale
} from 'lucide-react';

import { DecisionBadge } from '../common/DecisionBadge';

interface DecisionFlowExplainerProps {
  decision: Decision;
  factors: DecisionFactor[];
  confidence: number;
  uncertainty: number;
  oodScore: number;
  temperature?: number;
  oodThreshold?: number;
}

export const DecisionFlowExplainer: React.FC<DecisionFlowExplainerProps> = ({
  decision,
  factors,
  confidence,
  uncertainty,
  oodScore,
  temperature = 1.0136176347732544,
  oodThreshold = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-clinical-600" />
            <span>Tri-State Decision Engine Synthesis</span>
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            Transparent multi-criteria gating before allowing autonomous clinical outputs
          </p>
        </div>

        <DecisionBadge decision={decision} size="sm" />
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 mb-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px] text-xs">

          {/* Node 1: Confidence */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center shadow-soft-sm flex-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              1. Softmax Confidence
            </span>

            <span className="font-mono font-bold text-slate-800 text-sm">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />

          {/* Node 2: Calibration */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center shadow-soft-sm flex-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              2. Temperature Scaling
            </span>

            <span className="font-mono font-bold text-sky-700 text-sm">
              T = {temperature.toFixed(4)} (Calibrated)
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />

          {/* Node 3: Epistemic Check */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center shadow-soft-sm flex-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              3. MC Epistemic
            </span>

            <span
              className={`font-mono font-bold text-sm ${
                uncertainty > 0.4
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              I = {uncertainty.toFixed(6)}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />

          {/* Node 4: OOD Distance */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center shadow-soft-sm flex-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              4. Mahalanobis OOD
            </span>

            <span
              className={`font-mono font-bold text-sm ${
                oodScore > oodThreshold
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}
            >
              M = {oodScore.toFixed(2)}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-1 shrink-0" />

          {/* Node 5: Output Decision */}
          <div className="p-2 rounded-lg border text-center shadow-soft-sm shrink-0">
            <DecisionBadge decision={decision} size="sm" />
          </div>
        </div>
      </div>

      {/* Why did ClinSure make this decision? */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-clinical-600" />
            <span>Why did ClinSure make this decision? ({decision})</span>
          </span>

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 space-y-3 divide-y divide-slate-100 text-xs">
            {factors.map((f, i) => (
              <div
                key={i}
                className="pt-2.5 first:pt-0 flex items-start gap-3"
              >
                <div className="mt-0.5 shrink-0">
                  {f.status === 'pass' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}

                  {f.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}

                  {f.status === 'fail' && (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span>{f.factor}</span>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                        f.status === 'pass'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : f.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-3 text-[11px] text-slate-500 bg-slate-50/50 -mx-4 -mb-4 p-3 border-t border-slate-100 rounded-b-lg">
              <span className="font-semibold text-slate-700">
                Clinical Safeguard Rule:{' '}
              </span>

              The decision engine evaluates the live confidence, epistemic
              uncertainty, OOD distance, and composite risk values returned
              by the analysis pipeline. The final decision is determined by
              the configured safety gates rather than by confidence alone.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};