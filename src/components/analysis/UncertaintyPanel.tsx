import React from 'react';
import { UncertaintyMetrics } from '../../types';
import { HelpCircle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface UncertaintyPanelProps {
  uncertainty: UncertaintyMetrics;
}

export const UncertaintyPanel: React.FC<UncertaintyPanelProps> = ({ uncertainty }) => {
  const getBadgeStyle = (level: 'Low' | 'Moderate' | 'High') => {
    switch (level) {
      case 'Low':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          barColor: 'bg-emerald-500',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          barColor: 'bg-amber-500',
        };
      case 'High':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: ShieldAlert,
          iconColor: 'text-rose-600',
          barColor: 'bg-rose-500',
        };
    }
  };

  const badge = getBadgeStyle(uncertainty.level);
  const LevelIcon = badge.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>Uncertainty Assessment</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              MC-Dropout ({uncertainty.samplesCount} passes)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Decomposition into epistemic (model knowledge) and aleatoric (data) uncertainty
          </p>
        </div>

        <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${badge.bg}`}>
          <LevelIcon className={`w-3.5 h-3.5 ${badge.iconColor}`} />
          <span>{uncertainty.level} Epistemic Risk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Metric 1: Epistemic Uncertainty (Mutual Information) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 relative group">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">Epistemic Uncertainty</span>
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-slate-100 text-[10px] rounded shadow-lg z-20">
                Measures model ignorance / disagreement across stochastic parameter samples.
              </div>
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mb-2">
            {uncertainty.epistemicUncertainty.toFixed(6)}
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                uncertainty.epistemicUncertainty < 0.3
                  ? 'bg-emerald-500'
                  : uncertainty.epistemicUncertainty < 0.6
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(uncertainty.epistemicUncertainty * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0.0 (High Consensus)</span>
            <span>1.0 (Maximum Doubt)</span>
          </div>
        </div>

        {/* Metric 2: Predictive Entropy */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 relative group">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">Predictive Entropy</span>
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-slate-100 text-[10px] rounded shadow-lg z-20">
                Shannon entropy of the mean predictive posterior distribution H(p).
              </div>
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mb-2">
            {uncertainty.predictiveEntropy.toFixed(4)}
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-clinical-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((uncertainty.predictiveEntropy / 1.38) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0.0 (Sharp Peak)</span>
            <span>ln(C) (Uniform)</span>
          </div>
        </div>

        {/* Metric 3: MC-Dropout Variance */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 relative group">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">MC-Dropout Variance</span>
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-slate-100 text-[10px] rounded shadow-lg z-20">
                Empirical variance of softmax logits across stochastic forward passes.
              </div>
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mb-2">
            {uncertainty.mcDropoutVariance.toFixed(6)}
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(uncertainty.mcDropoutVariance * 120, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0.0 (Stable)</span>
            <span>&gt;0.5 (Unstable)</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-800">Clinical Interpretation: </span>
        {uncertainty.level === 'Low' && (
          <span>
            The model demonstrates robust internal consensus across stochastic forward passes. The observed epistemic uncertainty is low for this case.
          </span>
        )}
        {uncertainty.level === 'Moderate' && (
          <span>
            Elevated epistemic uncertainty detected. The model exhibits parameter instability on borderline findings, indicating this case benefits from radiologist verification.
          </span>
        )}
        {uncertainty.level === 'High' && (
          <span>
            Severe parameter divergence across forward passes. The network lacks sufficient representation for this radiological pattern; autonomous predictions are unsafe.
          </span>
        )}
      </div>
    </div>
  );
};
