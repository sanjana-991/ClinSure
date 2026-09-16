import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  History,
  BarChart3,
  ShieldAlert,
  Info,
  Activity,
  Sparkles,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      to: '/analyze',
      label: 'Analyze X-Ray',
      icon: ScanLine,
      highlight: true
    },
    {
      to: '/history',
      label: 'Analysis History',
      icon: History
    },
    {
      to: '/analytics',
      label: 'Model Analytics',
      icon: BarChart3
    },
    {
      to: '/robustness',
      label: 'Robustness & Shifts',
      icon: ShieldAlert,
      badge: 'Key'
    },
    {
      to: '/about',
      label: 'About ClinSure',
      icon: Info
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-950/40">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-clinical-600 to-teal-500 flex items-center justify-center shadow-md shadow-clinical-900/40 text-white font-bold group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">ClinSure</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-clinical-500/20 text-clinical-300 border border-clinical-500/30">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                Uncertainty-Aware AI
              </span>
            </div>
          </NavLink>
        </div>

        {/* Quick Demo Cases Widget */}
        <div className="px-3 pt-4 pb-2">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] uppercase font-semibold tracking-wider">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Demo Cases
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <NavLink
                to="/results/XR-2026-001"
                className={({ isActive }) =>
                  `py-1 text-center rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`
                }
                title="Case 001: Accept (High Confidence, In-Distribution)"
              >
                Accept
              </NavLink>
              <NavLink
                to="/results/XR-2026-002"
                className={({ isActive }) =>
                  `py-1 text-center rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`
                }
                title="Case 002: Uncertain (Ambiguous Pathology, High Epistemic Uncertainty)"
              >
                Uncertain
              </NavLink>
              <NavLink
                to="/results/XR-2026-003"
                className={({ isActive }) =>
                  `py-1 text-center rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`
                }
                title="Case 003: Abstain (Severe OOD Shift, Hardware Artifact)"
              >
                Abstain
              </NavLink>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Clinical Workflow
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-clinical-600 text-white shadow-md shadow-clinical-900/40 font-semibold'
                    : item.highlight
                    ? 'bg-clinical-950/60 text-clinical-300 border border-clinical-800/60 hover:bg-clinical-900/60'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : item.highlight ? 'text-clinical-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {!item.badge && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom System Status Section */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/60 space-y-2">
          {/* Status Indicator */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                System Status
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Calibrated
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>MC-Dropout: 25 passes</span>
              <span className="font-mono text-[10px] text-slate-400">T=1.18</span>
            </div>
          </div>

          {/* Clinical Disclaimer Tag */}
          <div className="px-2 py-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              <Activity className="w-3 h-3 text-clinical-400" />
              <span>AI Research Prototype</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
              Not for autonomous diagnostic use
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
