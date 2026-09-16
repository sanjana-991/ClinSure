import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';
import { UploadDropzone } from '../components/analysis/UploadDropzone';
import { WorkflowProgress } from '../components/analysis/WorkflowProgress';
import { DemoBanner } from '../components/common/DemoBanner';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export const AnalyzePage: React.FC = () => {
  const {
    result,
    currentStage,
    progressPercent,
    isLoading,
    error,
    runAnalysis,
    resetAnalysis,
  } = useAnalysis();

  const navigate = useNavigate();

  const handleFileSelected = async (
    file: File | { name: string; type: string; dataUrl: string },
    presetCaseId?: string
  ) => {
    try {
      const analysisResult = await runAnalysis(file, presetCaseId);
      // Automatically navigate to results page after brief completion pause
      setTimeout(() => {
        navigate(`/results/${analysisResult.id}`);
      }, 700);
    } catch (e) {
      console.error('Failed analysis flow:', e);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Analyze Chest Radiograph
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Upload a chest X-ray to evaluate classification, confidence, uncertainty, and distributional familiarity under cross-hospital safety gating.
        </p>
      </div>

      {/* Error state if analysis failed */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={resetAnalysis}
            className="px-3 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Dynamic Workflow: Either Dropzone or Multi-stage Progress */}
      {isLoading || currentStage !== 'idle' ? (
        <div className="space-y-6">
          <WorkflowProgress
            currentStage={currentStage}
            progressPercent={progressPercent}
          />

          {currentStage === 'complete' && result && (
            <div className="text-center pt-2">
              <button
                onClick={() => navigate(`/results/${result.id}`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-soft-md"
              >
                <span>Analysis Complete — View Diagnostic Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <UploadDropzone
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
