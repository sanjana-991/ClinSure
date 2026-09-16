import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { RobustnessMetrics } from '../types';
import { DemoBanner } from '../components/common/DemoBanner';
import { RobustnessComparisonChart } from '../components/charts/RobustnessComparisonChart';
import { AbstentionBehaviorChart } from '../components/charts/AbstentionBehaviorChart';
import {
  Hospital,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Info,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const RobustnessPage: React.FC = () => {
  const [data, setData] = useState<RobustnessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const metrics = await apiService.getRobustnessMetrics();
        setData(metrics);
      } catch (err) {
        console.error('Failed to load robustness metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clinical-50 text-clinical-700 text-xs font-semibold mb-2 border border-clinical-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Cross-Hospital Generalization &amp; Shift Benchmark</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Robustness Under Distribution Shift
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Evaluate whether ClinSure remains reliable when deployed across different hospital environments with varying scanner hardware, patient demographics, and medical hardware artifacts.
        </p>
      </div>

      {/* Core Scientific Principle Quote Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-clinical-950 text-white border border-slate-800 shadow-soft-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-clinical-600/30 text-clinical-300 border border-clinical-500/30 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              The Fundamental Principle of Clinical AI Robustness
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              &quot;A robust clinical AI system should not only perform well on familiar data; it must also recognize when deployment conditions differ from training conditions and step back rather than gamble with patient safety.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* 4 Hospital Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.hospitals.map((hosp) => (
          <div
            key={hosp.code}
            className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-soft-sm ${
              hosp.isShifted
                ? 'bg-white border-slate-200/90'
                : 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {hosp.code}
                </span>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    hosp.isShifted
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {hosp.shiftType}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                {hosp.name}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3 font-mono">
                Scanner: {hosp.deviceType}
              </p>

              <div className="space-y-1.5 text-xs py-3 border-y border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Accuracy:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(hosp.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AUROC:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {hosp.auroc.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calibration (ECE):</span>
                  <span className="font-mono font-bold text-rose-700">
                    {(hosp.ece * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Uncertainty:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {hosp.avgUncertainty.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Abstention Rate:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {(hosp.abstentionRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 italic leading-tight">
              {hosp.description}
            </p>
          </div>
        ))}
      </div>

      {/* Cross-Hospital Comparison Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Performance Degradation vs Calibration Across Deployment Sites
          </h3>
          <p className="text-xs text-slate-500">
            Notice how uncalibrated error (ECE) spikes under bedside ICU (HOSP-C) and pediatric shifts (HOSP-D).
          </p>
        </div>

        <RobustnessComparisonChart hospitals={data.hospitals} />
      </div>

      {/* Abstention Behavior Under Shift Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Safety Triage Response to Severity of Distribution Shift
            </h3>
            <p className="text-xs text-slate-500">
              As distribution shift worsens, ClinSure safely transitions cases from ACCEPT to UNCERTAIN and ABSTAIN.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">Accept</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">Uncertain</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-medium">Abstain</span>
          </div>
        </div>

        <AbstentionBehaviorChart data={data.abstentionComparison} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800">In-Distribution Behavior (Hospital A):</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When scans match the training hospital (PA upright, high signal-to-noise), ClinSure confidently accepts 88.5% of cases for automated reporting with an accuracy of 93.8%.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800">Shifted Site Behavior (Hospitals C &amp; D):</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When deployed to portable ICU bedside units or pediatric centers, ClinSure suppresses up to 47.0% of cases into ABSTAIN and 34.8% into UNCERTAIN, preventing high-stakes diagnostic errors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
