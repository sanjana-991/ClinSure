import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { DemoBanner } from '../components/common/DemoBanner';
import { ProbabilityBars } from '../components/analysis/ProbabilityBars';
import { UncertaintyPanel } from '../components/analysis/UncertaintyPanel';
import { OODPanel } from '../components/analysis/OODPanel';
import { DecisionFlowExplainer } from '../components/analysis/DecisionFlowExplainer';
import { XRayViewer } from '../components/viewer/XRayViewer';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  User,
  Hospital,
  Clock,
  Printer,
  Share2,
  ScanLine,
  FileCheck
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getAnalysisResult(id || 'XR-2026-001');
        setResult(data);
      } catch (err) {
        console.error('Error fetching result:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (isLoading || !result) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const getDecisionBanner = () => {
    switch (result.decision) {
      case 'ACCEPT':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          iconBg: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
          tag: 'Reliable Decision Support',
          borderAccent: 'border-l-4 border-l-emerald-600'
        };
      case 'UNCERTAIN':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-950',
          iconBg: 'bg-amber-600 text-white',
          icon: AlertTriangle,
          tag: 'Human Review Required',
          borderAccent: 'border-l-4 border-l-amber-600'
        };
      case 'ABSTAIN':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-950',
          iconBg: 'bg-rose-600 text-white',
          icon: ShieldAlert,
          tag: 'Safety Escalation • OOD',
          borderAccent: 'border-l-4 border-l-rose-600'
        };
    }
  };

  const banner = getDecisionBanner();
  const BannerIcon = banner.icon;

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <DemoBanner activeCaseId={result.id} />

      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
                {result.id}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {result.viewPosition} View
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {result.timestamp}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {result.patientId} ({result.patientAge}y {result.patientSex})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Hospital className="w-3.5 h-3.5 text-slate-400" />
                {result.hospitalSource}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-semibold shadow-soft-sm transition-colors"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Large Clinical Decision Banner (Section 9) */}
      <div className={`rounded-2xl border p-6 shadow-soft-sm ${banner.bg} ${banner.borderAccent}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 shadow-md ${banner.iconBg}`}>
              <BannerIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DecisionBadge decision={result.decision} size="md" />
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded font-bold bg-white/70 border border-slate-300">
                  {banner.tag}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1">
                {result.decisionHeadline}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                {result.decisionDescription}
              </p>
            </div>
          </div>

          <div className="md:text-right shrink-0 bg-white/60 p-4 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Clinical Action Required
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block max-w-xs">
              {result.clinicalAction}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column = Radiograph Viewer, Right Column = Diagnostic & Uncertainty Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Professional Radiograph Viewer */}
        <div className="lg:col-span-6 space-y-6">
          <XRayViewer
            imageUri={result.imageUri}
            caseId={result.id}
            patientId={result.patientId}
            viewPosition={result.viewPosition}
          />

          {/* Decision Engine Flow */}
          <DecisionFlowExplainer
            decision={result.decision}
            factors={result.decisionFactors}
            confidence={result.primaryProbability}
            uncertainty={result.uncertainty.epistemicUncertainty}
            oodScore={result.ood.mahalanobisDistance}
          />
        </div>

        {/* Right: Uncertainty, OOD, and Probability Panels */}
        <div className="lg:col-span-6 space-y-6">
          {/* Calibrated Probability Findings */}
          <ProbabilityBars
            predictions={result.predictions}
            primaryPrediction={result.primaryPrediction}
            calibrated={result.calibrated}
            temperature={result.temperature}
          />

          {/* Uncertainty Assessment Panel */}
          <UncertaintyPanel uncertainty={result.uncertainty} />

          {/* Distributional Familiarity / OOD Panel */}
          <OODPanel ood={result.ood} />

          {/* Diagnostic Metadata Card */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Inference compute time: <strong className="font-mono text-slate-800">{result.processingTimeMs} ms</strong></span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Hardware: NVIDIA A100 Tensor Core (FP16)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
