import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ScanLine,
  ShieldCheck,
  Hospital
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'System Overview';
    if (path === '/dashboard') return 'Clinical AI Dashboard';
    if (path === '/analyze') return 'Analyze Chest Radiograph';
    if (path.startsWith('/results')) return 'Diagnostic Uncertainty Report';
    if (path === '/history') return 'Analysis Case Registry';
    if (path === '/analytics') return 'Model Reliability Analytics';
    if (path === '/robustness') return 'Distribution Shift & Hospital Robustness';
    if (path === '/about') return 'About ClinSure System';
    return 'ClinSure Workstation';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-clinical-500"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getPageTitle()}</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Safety Policy Active
            </span>
          </h1>
        </div>
      </div>

      {/* Right Section: Quick actions & Clinical site */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Hospital source context */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <Hospital className="w-3.5 h-3.5 text-clinical-600" />
          <span className="font-medium text-slate-700">Metropolitan Center (ID)</span>
        </div>

        {/* Analyze X-Ray CTA button */}
        {location.pathname !== '/analyze' && (
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-clinical-600 hover:bg-clinical-700 text-white shadow-soft-sm transition-all focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:ring-offset-2"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Analysis</span>
            <span className="sm:hidden">Analyze</span>
          </button>
        )}

        {/* Direct Link to System Overview if on dashboard */}
        <Link
          to="/"
          className="hidden sm:inline-flex text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Overview
        </Link>
      </div>
    </header>
  );
};
