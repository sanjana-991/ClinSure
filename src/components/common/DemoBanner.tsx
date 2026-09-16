import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle, Ban } from 'lucide-react';

export const DemoBanner: React.FC<{ activeCaseId?: string }> = ({ activeCaseId }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-clinical-950 to-slate-900 text-white rounded-xl p-4 shadow-soft-md border border-clinical-800/40 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-clinical-600/30 border border-clinical-500/40 text-clinical-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO MODE
              </span>
              <span className="text-xs text-slate-300">
                Simulated research scenarios — Not a real clinical result
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-0.5">
              Explore how ClinSure differentiates between safe confidence, ambiguous presentation, and severe distribution shift:
            </p>
          </div>
        </div>

        {/* Quick Demo Case Switcher Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => navigate('/results/XR-2026-001')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCaseId === 'XR-2026-001'
                ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300/40'
                : 'bg-slate-800/90 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Case 001: Accept</span>
          </button>

          <button
            onClick={() => navigate('/results/XR-2026-002')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCaseId === 'XR-2026-002'
                ? 'bg-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-300/40'
                : 'bg-slate-800/90 text-amber-300 border border-amber-500/30 hover:bg-amber-950/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Case 002: Uncertain</span>
          </button>

          <button
            onClick={() => navigate('/results/XR-2026-003')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCaseId === 'XR-2026-003'
                ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300/40'
                : 'bg-slate-800/90 text-rose-300 border border-rose-500/30 hover:bg-rose-950/50'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span>Case 003: Abstain</span>
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-clinical-600 hover:bg-clinical-500 text-white transition-colors"
          >
            <span>Upload New</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
