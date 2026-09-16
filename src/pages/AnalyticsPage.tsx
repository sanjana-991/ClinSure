import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ModelMetrics } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { DemoBanner } from '../components/common/DemoBanner';
import { ReliabilityDiagram } from '../components/charts/ReliabilityDiagram';
import { ConfidenceDistributionChart } from '../components/charts/ConfidenceDistributionChart';
import { UncertaintyDistributionChart } from '../components/charts/UncertaintyDistributionChart';
import {
  Award,
  CheckCircle2,
  Scale,
  Sparkles,
  BarChart2,
  TrendingDown,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getModelMetrics();
        setMetrics(data);
      } catch (e) {
        console.error('Failed to load model metrics:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />
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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
            DenseNet-121 Backbone
          </span>
          <span className="text-xs text-slate-400">
            N=12,450 Validation Cohort
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Model Reliability &amp; Calibration Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rigorous evaluation of predictive power, temperature scaling calibration, and epistemic uncertainty distributions.
        </p>
      </div>

      {/* 6 Top Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Accuracy"
          value={`${(metrics.accuracy * 100).toFixed(1)}%`}
          subtitle="In-Distribution"
          badgeText="High"
          badgeVariant="success"
        />

        <MetricCard
          title="Precision"
          value={`${(metrics.precision * 100).toFixed(1)}%`}
          subtitle="Macro-average"
          badgeText="Robust"
          badgeVariant="info"
        />

        <MetricCard
          title="Recall"
          value={`${(metrics.recall * 100).toFixed(1)}%`}
          subtitle="Sensitivity"
          badgeText="High"
          badgeVariant="success"
        />

        <MetricCard
          title="F1 Score"
          value={`${(metrics.f1Score * 100).toFixed(1)}%`}
          subtitle="Harmonic mean"
          badgeText="Target"
          badgeVariant="info"
        />

        <MetricCard
          title="AUROC"
          value={metrics.auroc.toFixed(3)}
          subtitle="ROC discrimination"
          badgeText="0.948"
          badgeVariant="success"
        />

        <MetricCard
          title="ECE (Calib Error)"
          value={`${(metrics.ece * 100).toFixed(1)}%`}
          subtitle="Down from 9.8%"
          trend={{ value: 'T=1.18 Opt', isPositive: true }}
          badgeText="Calibrated"
          badgeVariant="success"
        />
      </div>

      {/* Main Calibration Reliability Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-clinical-600" />
              <span>Reliability Diagram (Post-Hoc Probability Calibration)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluates whether predicted confidence corresponds to true observed empirical accuracy (y = x perfect diagonal).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="p-1.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200">
              Optimal Temp T* = 1.18
            </span>
          </div>
        </div>

        <ReliabilityDiagram data={metrics.calibrationData} ece={metrics.ece} />

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-clinical-600" />
            <span>Why Temperature Scaling is Critical for Medical Decisions:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Standard modern neural networks without calibration are notoriously overconfident — predicting 95% certainty when actual correctness is only 80%. By minimizing Negative Log-Likelihood on held-out validation logits, ClinSure shrinks the Expected Calibration Error (ECE) from 9.8% down to 2.4%, making probability values statistically credible.
          </p>
        </div>
      </div>

      {/* Histograms Grid: Confidence vs Uncertainty Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Histogram */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Confidence Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Density of calibrated top-class prediction probabilities
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Mean: 89.4%</span>
          </div>

          <ConfidenceDistributionChart data={metrics.confidenceDistribution} />
        </div>

        {/* Epistemic Uncertainty Histogram */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Epistemic Uncertainty Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Mutual Information I(y, W | x) across MC-Dropout passes
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Mean: 0.16</span>
          </div>

          <UncertaintyDistributionChart data={metrics.uncertaintyDistribution} />
        </div>
      </div>

      {/* Decision Distribution Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
          Clinical Triage Allocation Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Safe autonomous delegation rate vs clinician review escalation on validation cohort
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.decisionBreakdown.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mb-1">
                {item.percentage}%
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {item.count.toLocaleString()} cases
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
