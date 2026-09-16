import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { MetricCard } from '../components/common/MetricCard';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { DemoBanner } from '../components/common/DemoBanner';
import { PredictionDistributionDonut } from '../components/charts/PredictionDistributionDonut';
import { ConfidenceVsUncertaintyScatter } from '../components/charts/ConfidenceVsUncertaintyScatter';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Target,
  FileSearch,
  ArrowUpRight,
  ScanLine,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { stats, isLoading, error } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Clinical AI Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor chest X-ray analyses, uncertainty metrics, and distributional safety triage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white font-semibold text-xs shadow-soft-sm transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span>Analyze Chest X-Ray</span>
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Analyses"
          value={stats.totalAnalyses.toLocaleString()}
          subtitle="Hospital cohort volume"
          icon={Activity}
          badgeText="Live"
          badgeVariant="info"
        />

        <MetricCard
          title="Accepted"
          value={stats.accepted.toLocaleString()}
          subtitle={`${Math.round((stats.accepted / stats.totalAnalyses) * 100)}% of cohort`}
          icon={CheckCircle2}
          badgeText="Reliable"
          badgeVariant="success"
        />

        <MetricCard
          title="Uncertain"
          value={stats.uncertain.toLocaleString()}
          subtitle={`${Math.round((stats.uncertain / stats.totalAnalyses) * 100)}% of cohort`}
          icon={AlertTriangle}
          badgeText="Review"
          badgeVariant="warning"
        />

        <MetricCard
          title="Abstained"
          value={stats.abstained.toLocaleString()}
          subtitle={`${Math.round((stats.abstained / stats.totalAnalyses) * 100)}% of cohort`}
          icon={ShieldAlert}
          badgeText="Suppressed"
          badgeVariant="danger"
        />

        <MetricCard
          title="Avg Confidence"
          value={`${(stats.averageConfidence * 100).toFixed(1)}%`}
          subtitle="Calibrated (T=1.18)"
          icon={Target}
          trend={{ value: 'ECE: 2.4%', isPositive: true }}
        />

        <MetricCard
          title="OOD Cases"
          value={stats.oodCases}
          subtitle="Mahalanobis &gt; 1.50"
          icon={FileSearch}
          badgeText="Shift"
          badgeVariant="danger"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Prediction Distribution Donut */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Safety Triage Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of Accepted, Uncertain, and Abstained cases
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">N={stats.totalAnalyses}</span>
          </div>

          <PredictionDistributionDonut data={stats.decisionDistribution} />

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Accepted</div>
              <div className="text-sm font-bold font-mono">76.1%</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-900">
              <div className="text-[10px] uppercase font-bold text-amber-700">Uncertain</div>
              <div className="text-sm font-bold font-mono">16.3%</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-900">
              <div className="text-[10px] uppercase font-bold text-rose-700">Abstained</div>
              <div className="text-sm font-bold font-mono">7.6%</div>
            </div>
          </div>
        </div>

        {/* Chart 2: Confidence vs Uncertainty Scatter */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Confidence vs. Epistemic Uncertainty
              </h3>
              <p className="text-xs text-slate-500">
                Samples demonstrating selective triage across the decision boundary
              </p>
            </div>
            <Link
              to="/analytics"
              className="text-xs text-clinical-600 hover:text-clinical-700 font-medium flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ConfidenceVsUncertaintyScatter data={stats.confidenceVsUncertainty} />
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Recent Case Registry
            </h3>
            <p className="text-xs text-slate-500">
              Latest evaluations with confidence, epistemic uncertainty, and OOD scores
            </p>
          </div>

          <Link
            to="/history"
            className="text-xs text-clinical-600 hover:text-clinical-700 font-semibold flex items-center gap-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">AI Prediction</th>
                <th className="py-3 px-4 font-mono">Confidence</th>
                <th className="py-3 px-4">Epistemic Uncertainty</th>
                <th className="py-3 px-4 font-mono">OOD Score</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentAnalyses.slice(0, 6).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <Link to={`/results/${row.id}`} className="hover:text-clinical-600">
                      {row.id}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {row.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {row.prediction}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {(row.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        row.uncertaintyLevel === 'Low'
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.uncertaintyLevel === 'Moderate'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {row.uncertaintyLevel} ({row.epistemicUncertainty.toFixed(2)})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <span className={row.oodScore > 1.5 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      {row.oodScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <DecisionBadge decision={row.decision} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/results/${row.id}`)}
                      className="inline-flex items-center gap-1 text-clinical-600 hover:text-clinical-800 font-medium text-xs"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
