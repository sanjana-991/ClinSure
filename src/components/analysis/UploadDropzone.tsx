import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Check
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../../data/mockData';

interface UploadDropzoneProps {
  onFileSelected: (
    file: File | { name: string; type: string; dataUrl: string },
    presetCaseId?: string
  ) => void;
  isLoading?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    previewUrl: string;
    isPreset?: boolean;
    presetCaseId?: string;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'image/jpeg',
        previewUrl,
        isPreset: false,
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'image/jpeg',
        previewUrl,
        isPreset: false,
      });
    }
  };

  const handleSelectPreset = (
    caseId: string,
    label: string,
    imageUri: string,
    meta: string
  ) => {
    setSelectedFile({
      name: `${caseId}_${label.toLowerCase().replace(/\s+/g, '_')}.dcm`,
      size: '14.2 MB (DICOM 16-bit)',
      type: 'application/dicom',
      previewUrl: imageUri,
      isPreset: true,
      presetCaseId: caseId,
    });
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) return;

    if (selectedFile.isPreset && selectedFile.presetCaseId) {
      onFileSelected(
        {
          name: selectedFile.name,
          type: selectedFile.type,
          dataUrl: selectedFile.previewUrl,
        },
        selectedFile.presetCaseId
      );
    } else {
      // Mock File object wrapper
      onFileSelected({
        name: selectedFile.name,
        type: selectedFile.type,
        dataUrl: selectedFile.previewUrl,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Clinical Presets Selector */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-soft-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Select a Sample Clinical Radiograph</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Instant load without uploading local files
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sample 1: In-Distribution Pneumonia */}
          <button
            type="button"
            onClick={() =>
              handleSelectPreset(
                'XR-2026-001',
                'Pneumonia Right Base',
                SAMPLE_IMAGES.pneumonia,
                'In-Distribution PA'
              )
            }
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
              selectedFile?.presetCaseId === 'XR-2026-001'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-700">
              <img
                src={SAMPLE_IMAGES.pneumonia}
                alt="Pneumonia"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Case 001: Accept
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-100 text-emerald-800">
                  ID
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                R. Basilar Consolidation
              </p>
              <span className="text-[10px] text-emerald-700 font-medium">
                High Confidence • Safe
              </span>
            </div>
          </button>

          {/* Sample 2: Borderline Subtle / Uncertain */}
          <button
            type="button"
            onClick={() =>
              handleSelectPreset(
                'XR-2026-002',
                'Borderline Markings',
                SAMPLE_IMAGES.normal,
                'Borderline PA'
              )
            }
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
              selectedFile?.presetCaseId === 'XR-2026-002'
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-700">
              <img
                src={SAMPLE_IMAGES.normal}
                alt="Subtle"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Case 002: Uncertain
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-800">
                  Doubt
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Borderline Lung Markings
              </p>
              <span className="text-[10px] text-amber-700 font-medium">
                High Epistemic Uncertainty
              </span>
            </div>
          </button>

          {/* Sample 3: Shift / OOD Hardware */}
          <button
            type="button"
            onClick={() =>
              handleSelectPreset(
                'XR-2026-003',
                'Bedside Pacemaker Shift',
                SAMPLE_IMAGES.oodShift,
                'Hospital C ICU Shift'
              )
            }
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
              selectedFile?.presetCaseId === 'XR-2026-003'
                ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-700">
              <img
                src={SAMPLE_IMAGES.oodShift}
                alt="Shift"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Case 003: Abstain
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-rose-100 text-rose-800">
                  OOD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                ICU Portable AP + Pacemaker
              </p>
              <span className="text-[10px] text-rose-700 font-medium">
                Severe Domain Shift
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Upload Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 transition-all text-center ${
          isDragOver
            ? 'border-clinical-500 bg-clinical-50/60 ring-4 ring-clinical-500/20'
            : selectedFile
            ? 'border-slate-300 bg-slate-50/40'
            : 'border-slate-300 hover:border-clinical-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.dcm,.dicom"
          onChange={handleFileChange}
          className="hidden"
          id="xray-upload-input"
        />

        {!selectedFile ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-clinical-50 text-clinical-600 border border-clinical-200/80 mx-auto flex items-center justify-center shadow-soft-sm">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Drag &amp; drop chest radiograph here
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Supports standard DICOM (.dcm), PNG, JPG, or high-resolution TIFF
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-semibold shadow-soft-sm transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-500"
              >
                Browse Local Files
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-4 pt-2">
              <span>Max size: 50MB</span>
              <span>•</span>
              <span>16-bit Grayscale</span>
              <span>•</span>
              <span>HIPAA Compliant In-Memory Processing</span>
            </div>
          </div>
        ) : (
          /* Image Selected / Preview State */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* Preview Thumbnail */}
              <div className="relative w-44 h-44 rounded-xl bg-slate-950 overflow-hidden border border-slate-700 shadow-soft-md group">
                <img
                  src={selectedFile.previewUrl}
                  alt="Selected Chest Radiograph"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metadata Details */}
              <div className="text-left space-y-2 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <FileCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedFile.size} • {selectedFile.type}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-100/80 border border-slate-200 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedFile.isPreset ? selectedFile.presetCaseId : 'User Upload'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-mono text-slate-700">Thoracic Radiograph (512x512)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Safety Check:</span>
                    <span className="text-emerald-700 font-medium">Ready for Triage Evaluation</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-xs text-rose-600 hover:text-rose-700 px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div>
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white font-semibold text-sm shadow-soft-md transition-all focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:ring-offset-2 flex items-center justify-center gap-2 mx-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Run Uncertainty-Aware Analysis</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Safety Advisory Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">
            Clinical Safety Protocol Active
          </p>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            AI analysis evaluates both prediction and prediction reliability. Cases with elevated epistemic uncertainty or out-of-distribution Mahalanobis feature distance will be flagged for human radiologist review or abstained. Do not use this prototype as the sole basis for clinical decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
