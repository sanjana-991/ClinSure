import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { DemoBanner } from '../components/common/DemoBanner';
import { Decision } from '../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { history, isLoading } = useAnalysisHistory();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDecision, setSelectedDecision] = useState<string>('ALL');
  const [selectedPrediction, setSelectedPrediction] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'uncertainty' | 'ood'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Filtered and sorted dataset
  const filteredData = useMemo(() => {
    return history
      .filter((item) => {
        const matchesQuery =
          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.prediction.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDecision =
          selectedDecision === 'ALL' || item.decision === selectedDecision;

        const matchesPrediction =
          selectedPrediction === 'ALL' || item.prediction === selectedPrediction;

        return matchesQuery && matchesDecision && matchesPrediction;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else if (sortBy === 'confidence') {
          diff = b.confidence - a.confidence;
        } else if (sortBy === 'uncertainty') {
          diff = b.epistemicUncertainty - a.epistemicUncertainty;
        } else if (sortBy === 'ood') {
          diff = b.oodScore - a.oodScore;
        }
        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [history, searchQuery, selectedDecision, selectedPrediction, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'date' | 'confidence' | 'uncertainty' | 'ood') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-8">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Analysis Case Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical chest radiograph evaluations with calibrated metrics, epistemic scores, and safety decisions.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting PACS study registry to CSV...')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-soft-sm self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Case ID or Patient..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter: Decision State */}
          <div>
            <select
              value={selectedDecision}
              onChange={(e) => {
                setSelectedDecision(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Decision States</option>
              <option value="ACCEPT">ACCEPT (Reliable)</option>
              <option value="UNCERTAIN">UNCERTAIN (Review Required)</option>
              <option value="ABSTAIN">ABSTAIN (OOD / Withheld)</option>
            </select>
          </div>

          {/* Filter: Pathology */}
          <div>
            <select
              value={selectedPrediction}
              onChange={(e) => {
                setSelectedPrediction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:bg-white transition-all"
            >
              <option value="ALL">All Diagnostic Classes</option>
              <option value="Pneumonia">Pneumonia</option>
              <option value="No Finding">No Finding</option>
              <option value="Cardiomegaly">Cardiomegaly</option>
              <option value="Pleural Effusion">Pleural Effusion</option>
              <option value="Pneumothorax">Pneumothorax</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => toggleSort(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:bg-white transition-all"
            >
              <option value="date">Sort by Date</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="uncertainty">Sort by Uncertainty</option>
              <option value="ood">Sort by OOD Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4 font-mono">Case ID</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date &amp; Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Patient / Site</th>
                <th className="py-3.5 px-4">AI Prediction</th>
                <th
                  onClick={() => toggleSort('confidence')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 font-mono"
                >
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('uncertainty')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Epistemic Uncertainty</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('ood')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 font-mono"
                >
                  <div className="flex items-center gap-1">
                    <span>OOD Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/results/${row.id}`} className="hover:text-clinical-600">
                        {row.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {row.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {row.patientId}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {row.hospitalSource}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {row.prediction}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {(row.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <span className={row.oodScore > 1.5 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {row.oodScore.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <DecisionBadge decision={row.decision} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/results/${row.id}`)}
                        className="inline-flex items-center gap-1 text-clinical-600 hover:text-clinical-800 font-medium text-xs"
                      >
                        <span>View Result</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No clinical cases found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{paginatedData.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredData.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
