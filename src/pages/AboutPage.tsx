import React from 'react';
import { DemoBanner } from '../components/common/DemoBanner';
import {
  Stethoscope,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Scale,
  GitBranch,
  BookOpen,
  AlertCircle,
  Code2,
  Lock,
  ExternalLink
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto py-2">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Hero / Introduction */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clinical-50 text-clinical-700 text-xs font-semibold border border-clinical-200">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Research System Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About ClinSure
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          ClinSure (MedSure AI) is an uncertainty-aware clinical decision-support prototype for chest radiograph classification designed to prevent dangerous overconfident predictions under real-world hospital distribution shifts.
        </p>
      </div>

      {/* Research Objective */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-clinical-950 to-slate-900 text-white border border-slate-800 shadow-soft-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-clinical-300">
          <Sparkles className="w-4 h-4" />
          <span>Primary Research Objective</span>
        </div>
        <p className="text-lg sm:text-xl font-bold leading-snug">
          &quot;Move from prediction-only AI toward risk-aware AI that can recognize its own limitations and step back when uncertain.&quot;
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          In medical imaging, a model that knows when it does not know is far safer than a model that produces brittle, overconfident diagnoses on unseen clinical conditions.
        </p>
      </div>

      {/* Why Uncertainty-Aware AI? */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-clinical-600" />
          <span>Why Uncertainty-Aware AI?</span>
        </h2>
        <div className="prose prose-sm text-slate-600 space-y-3 text-xs sm:text-sm leading-relaxed">
          <p>
            Standard deep neural networks are trained with empirical risk minimization and cross-entropy loss. While this achieves high benchmark accuracy on benchmark test sets (such as NIH ChestX-ray14 or CheXpert), the uncalibrated softmax function creates extreme probabilities near 0 or 1.
          </p>
          <p>
            When deployed in clinical practice, models face scanner variations (GE, Siemens, Philips), different radiation dosages (kVp, mAs), demographic discrepancies (pediatric vs geriatric), and foreign medical hardware (pacemakers, endotracheal tubes). Conventional AI frequently predicts catastrophic false positives with 98% confidence. ClinSure eliminates this hazard.
          </p>
        </div>
      </section>

      {/* 8 Core AI Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-clinical-600" />
          <span>Key AI Components &amp; Technical Methods</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'DenseNet-121 / ResNet Backbone',
              detail: 'Extracts 1024-dimensional penultimate feature embeddings z from high-resolution 16-bit thoracic radiographs.'
            },
            {
              title: 'Probability Calibration (Platt Scaling)',
              detail: 'Learns a scalar temperature parameter T* on validation logits, reducing Expected Calibration Error from 9.8% to 2.4%.'
            },
            {
              title: 'Monte Carlo Dropout (MC-Dropout)',
              detail: 'Keeps dropout active at inference across 25 passes to generate a Bayesian approximation of the posterior weight distribution.'
            },
            {
              title: 'Epistemic Uncertainty Isolation',
              detail: 'Computes Mutual Information I(y, W | x) = H(p_mean) - E[H(p_i)] to separate model ignorance from stochastic noise.'
            },
            {
              title: 'Mahalanobis-Distance OOD Detection',
              detail: 'Fits class-conditional Gaussian centroids in latent feature space to detect foreign scanner hardware and anatomical shifts.'
            },
            {
              title: 'Tri-State Safety Triage Engine',
              detail: 'Enforces hierarchical safety gates: Accept (autonomous draft), Uncertain (human review), and Abstain (escalation).'
            },
            {
              title: 'Cross-Hospital Distribution Shift',
              detail: 'Systematically benchmarked across 4 distinct hospital cohorts to measure graceful performance degradation.'
            },
            {
              title: 'Clinical Explainability Maps',
              detail: 'Supports Grad-CAM saliency heatmaps and visual attention maps to highlight the anatomical focus of deep layers.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-soft-sm space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-clinical-50 text-clinical-700 text-xs font-mono font-bold flex items-center justify-center border border-clinical-200">
                  {idx + 1}
                </span>
                <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-clinical-600" />
          <span>Technology Stack</span>
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-800 block mb-1">Frontend Framework</span>
              <span className="text-slate-500 font-mono">React 18 + TypeScript + Vite</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-1">Styling &amp; Design</span>
              <span className="text-slate-500 font-mono">Tailwind CSS + Medical SaaS</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-1">Charts &amp; Visuals</span>
              <span className="text-slate-500 font-mono">Recharts SVG + Custom DICOM</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-1">Backend Protocol</span>
              <span className="text-slate-500 font-mono">FastAPI REST / In-Memory Mock</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Clinical Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-4 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-950">Academic &amp; Clinical Safety Disclaimer</h4>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            ClinSure is an academic/research prototype. Its outputs should not be interpreted as medical diagnoses or used as a substitute for qualified healthcare professionals. Autonomous clinical implementation requires institutional review board (IRB) oversight and clinical trial validation.
          </p>
        </div>
      </div>
    </div>
  );
};
