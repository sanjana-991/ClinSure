import React from 'react';
import { AnalysisStage } from '../../types';
import { ANALYSIS_STAGES } from '../../services/api';
import { CheckCircle2, Loader2, Circle, ShieldCheck } from 'lucide-react';

interface WorkflowProgressProps {
  currentStage: AnalysisStage;
  progressPercent: number;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStage,
  progressPercent,
}) => {
  const getStageStatus = (stageId: AnalysisStage) => {
    const stageOrder: AnalysisStage[] = [
      'preprocessing',
      'feature_extraction',
      'classification',
      'calibration',
      'mc_dropout',
      'ood_detection',
      'decision',
      'complete'
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const thisIndex = stageOrder.indexOf(stageId);

    if (currentStage === 'complete' || currentIndex > thisIndex) {
      return 'completed';
    }
    if (currentIndex === thisIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-soft-md max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-clinical-50 border border-clinical-200 text-clinical-600 mb-3 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Evaluating Radiographic Uncertainty &amp; Distribution
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Executing deep feature extraction, temperature calibration, MC-Dropout sampling, and Mahalanobis OOD gating...
        </p>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-600 mb-2">
          <span>PIPELINE PROGRESS</span>
          <span className="text-clinical-700">{progressPercent}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-clinical-600 to-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Multi-stage Checklist */}
      <div className="space-y-3">
        {ANALYSIS_STAGES.map((stage, idx) => {
          const status = getStageStatus(stage.id);

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                status === 'active'
                  ? 'bg-clinical-50/70 border-clinical-300 shadow-soft-sm'
                  : status === 'completed'
                  ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                  : 'bg-white border-transparent text-slate-400 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {status === 'completed' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                {status === 'active' && (
                  <Loader2 className="w-5 h-5 text-clinical-600 animate-spin" />
                )}
                {status === 'pending' && (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      status === 'active'
                        ? 'text-clinical-900 font-bold'
                        : status === 'completed'
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx + 1}. {stage.label}
                  </span>
                  {status === 'active' && (
                    <span className="text-[10px] font-mono uppercase bg-clinical-200/60 text-clinical-800 px-2 py-0.5 rounded-full">
                      Running
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="text-[10px] font-mono text-emerald-700">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {stage.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
        ClinSure evaluates prediction validity before presenting conclusions. Unreliable or OOD cases will be flagged.
      </div>
    </div>
  );
};
