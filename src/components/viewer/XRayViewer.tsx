import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RefreshCw,
  Sun,
  Contrast as ContrastIcon,
  Eye,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';

interface XRayViewerProps {
  imageUri: string;
  caseId: string;
  patientId: string;
  viewPosition?: string;
  className?: string;
}

export const XRayViewer: React.FC<XRayViewerProps> = ({
  imageUri,
  caseId,
  patientId,
  viewPosition = 'PA',
  className = '',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'original' | 'gradcam' | 'attention'>('original');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden shadow-soft-lg select-none ${className}`}
    >
      {/* Top Header Bar with Tabs and Meta */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        {/* Radiologic Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === 'original'
                ? 'bg-clinical-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original Radiograph
          </button>
          <button
            onClick={() => setActiveTab('gradcam')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
              activeTab === 'gradcam'
                ? 'bg-clinical-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Grad-CAM Saliency</span>
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
              activeTab === 'attention'
                ? 'bg-clinical-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-teal-300" />
            <span>Attention Maps</span>
          </button>
        </div>

        {/* Radiologic Metadata Tags */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
            {caseId}
          </span>
          <span className="text-slate-500">•</span>
          <span>{patientId}</span>
          <span className="text-slate-500">•</span>
          <span className="font-semibold text-clinical-400">{viewPosition} ERECT</span>
        </div>
      </div>

      {/* Main Radiograph Canvas Area */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden bg-slate-950 p-4">
        {/* Diagnostic Grid Markers */}
        <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500 pointer-events-none z-10">
          <div>SCALE: 1:1 CALIBRATED</div>
          <div>WINDOW: THORACIC LUNG</div>
        </div>

        <div className="absolute top-4 right-4 text-xs font-bold font-mono text-slate-400 pointer-events-none z-10 border border-slate-700/80 px-2 py-0.5 rounded bg-slate-900/60">
          R
        </div>

        {/* Radiograph Image with CSS filters */}
        <div
          className="relative transition-transform duration-100 ease-out flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={imageUri}
            alt={`Chest radiograph for ${caseId}`}
            className="max-h-[440px] max-w-full object-contain rounded shadow-2xl transition-all"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : 'none'}`,
            }}
          />

          {/* Grad-CAM Overlay simulation when Grad-CAM tab is active */}
          {activeTab === 'gradcam' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full opacity-60 mix-blend-screen" viewBox="0 0 400 400">
                <radialGradient id="gradcamHeat" cx="35%" cy="65%" r="40%">
                  <stop offset="0%" stop-color="#ef4444" stop-opacity="0.85"/>
                  <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.6"/>
                  <stop offset="70%" stop-color="#10b981" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                </radialGradient>
                <circle cx="140" cy="260" r="90" fill="url(#gradcamHeat)"/>
              </svg>
              <div className="absolute bottom-4 left-4 bg-slate-900/90 text-amber-300 text-xs px-2.5 py-1 rounded border border-amber-500/40 backdrop-blur-sm">
                Active Activation Heatmap: Lower Right Consolidation
              </div>
            </div>
          )}

          {/* Attention Map Overlay simulation */}
          {activeTab === 'attention' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full opacity-50 mix-blend-color-dodge" viewBox="0 0 400 400">
                <rect x="90" y="210" width="100" height="90" rx="10" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
                <circle cx="140" cy="255" r="4" fill="#38bdf8"/>
                <line x1="140" y1="210" x2="140" y2="300" stroke="#38bdf8" stroke-width="0.5"/>
                <line x1="90" y1="255" x2="190" y2="255" stroke="#38bdf8" stroke-width="0.5"/>
              </svg>
              <div className="absolute bottom-4 left-4 bg-slate-900/90 text-teal-300 text-xs px-2.5 py-1 rounded border border-teal-500/40 backdrop-blur-sm">
                Self-Attention Spatial Focus: Token Patch [14, 26]
              </div>
            </div>
          )}
        </div>

        {/* Explainability placeholder alert if original tab chosen */}
        {activeTab === 'original' && (
          <div className="absolute bottom-3 left-4 text-[11px] text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded backdrop-blur-sm border border-slate-800">
            Click &apos;Grad-CAM&apos; or &apos;Attention&apos; to view saliency heatmaps
          </div>
        )}
      </div>

      {/* Interactive Radiologic Workstation Controls */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between flex-wrap gap-3 text-slate-300 text-xs">
        {/* Left: Zoom & Transform buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-400 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Rotate 90 degrees"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setInvert(!invert)}
            className={`p-1.5 rounded transition-colors ${
              invert ? 'bg-clinical-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Invert Gray Window (Bones Black / White)"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Reset All Adjustments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Brightness & Contrast Sliders */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="50"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-clinical-500"
              title="Adjust Brightness"
            />
          </div>

          <div className="flex items-center gap-2">
            <ContrastIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="50"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-clinical-500"
              title="Adjust Contrast"
            />
          </div>
        </div>

        {/* Right: Fullscreen & Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
