import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Safety Disclaimer */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          <div className="p-1 rounded bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Safety Notice:</span> Research prototype • AI-assisted decision support • Not a medical diagnosis. Qualified clinician review required.
          </p>
        </div>

        {/* Links and Version */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            Methodology & Architecture
          </Link>
          <span>•</span>
          <Link to="/robustness" className="hover:text-slate-600 transition-colors">
            Cross-Hospital Benchmark
          </Link>
          <span>•</span>
          <span className="font-mono text-slate-400">ClinSure v1.0.4</span>
        </div>
      </div>
    </footer>
  );
};
