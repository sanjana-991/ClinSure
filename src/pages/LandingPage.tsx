import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
  Activity,
  Scan,
  Cpu,
  Sliders,
  Scale,
  Hospital,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/mockData';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-soft-xl">
        <div className="absolute inset-0 medical-grid-pattern opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clinical-500/20 border border-clinical-400/30 text-clinical-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-clinical-300" />
            <span>Uncertainty-Aware Clinical Decision Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            ClinSure
            <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-clinical-400 via-teal-300 to-sky-200 mt-2 font-sans">
              Towards Safer Clinical Decisions with Uncertainty-Aware AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An uncertainty-aware chest X-ray analysis system designed to recognize when AI should predict — and when it should step back.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/analyze')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-clinical-600 hover:bg-clinical-500 text-white font-semibold text-sm shadow-lg shadow-clinical-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span>Analyze Chest X-Ray</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Dashboard</span>
            </button>
          </div>
        </div>

        {/* Hero Visual: Chest X-ray → AI Analysis → Confidence + Uncertainty → Clinical Decision */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="text-center text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">
              Integrated Triage Pipeline
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Stage 1: Radiograph */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden border border-slate-700">
                  <img src={SAMPLE_IMAGES.pneumonia} alt="X-ray" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-bold text-slate-200">Chest X-Ray</div>
                <p className="text-[11px] text-slate-400">16-bit Thoracic Scan</p>
              </div>

              {/* Stage 2: Deep Analysis */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg bg-clinical-950/60 border border-clinical-700/50 flex items-center justify-center text-clinical-400">
                  <Cpu className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-200">AI Analysis</div>
                <p className="text-[11px] text-slate-400">DenseNet + Calibration</p>
              </div>

              {/* Stage 3: Uncertainty & OOD */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg bg-teal-950/60 border border-teal-700/50 flex items-center justify-center text-teal-400">
                  <Sliders className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-200">Confidence + Uncertainty</div>
                <p className="text-[11px] text-slate-400">MC-Dropout &amp; Mahalanobis</p>
              </div>

              {/* Stage 4: Tri-State Decision */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <Scale className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-200">Clinical Triage</div>
                <p className="text-[11px] text-slate-400">Accept • Uncertain • Abstain</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Uncertainty Matters */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Why Uncertainty Matters in Clinical AI
          </h2>
          <p className="text-sm text-slate-600">
            Conventional deep learning models force predictions with dangerous overconfidence, even on corrupted, alien, or borderline patient scans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Failure of standard AI */}
          <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-soft-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Conventional Uncalibrated AI</h3>
                <p className="text-xs text-rose-600 font-medium">Overconfident Misdiagnoses</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Softmax squashes outputs into near-100% confidence even on out-of-distribution scans.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Silent failure on cross-hospital scanner variations, foreign hardware, and patient positioning shifts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>No self-awareness: cannot differentiate between model ignorance and definitive radiological findings.</span>
              </li>
            </ul>
          </div>

          {/* ClinSure Approach */}
          <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-soft-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ClinSure Uncertainty-Aware AI</h3>
                <p className="text-xs text-emerald-600 font-medium">Principled Safety Gating</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Temperature scaling guarantees empirical probabilities match actual clinical accuracy.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>MC-Dropout isolates epistemic doubt across stochastic passes before presenting conclusions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Mahalanobis distance detects scanner domain shifts and halts classification on unfamiliar images.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Three-Way Decision System */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Three-Way Decision System
          </h2>
          <p className="text-sm text-slate-600">
            ClinSure replaces uncalibrated binary decisions with three clinically actionable states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: ACCEPT */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-soft-sm hover:shadow-soft-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                ACCEPT
              </span>
              <span className="text-xs text-slate-400">Reliable Prediction</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              &quot;Prediction is sufficiently reliable.&quot;
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Calibrated confidence exceeds clinical threshold, epistemic uncertainty is low, and feature representation sits securely inside the in-distribution manifold.
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
              Action: Automated draft report generated for radiologist sign-off.
            </div>
          </div>

          {/* Card 2: UNCERTAIN */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-soft-sm hover:shadow-soft-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                UNCERTAIN
              </span>
              <span className="text-xs text-slate-400">Elevated Doubt</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              &quot;Prediction shows elevated uncertainty.&quot;
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Scan is in-distribution, but the model exhibits high epistemic variance across dropout sub-networks or borderline confidence on subtle, ambiguous anatomy.
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-amber-800 font-medium">
              Action: Priority flagged for secondary radiologist verification.
            </div>
          </div>

          {/* Card 3: ABSTAIN */}
          <div className="bg-white rounded-2xl border border-rose-200/80 p-6 shadow-soft-sm hover:shadow-soft-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                ABSTAIN
              </span>
              <span className="text-xs text-slate-400">Prediction Withheld</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              &quot;Case appears unreliable or unfamiliar. Human review required.&quot;
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Mahalanobis feature distance exceeds safety threshold due to scanner hardware shift, artifacts, pacemakers, or corrupted acquisition. AI strictly abstains.
            </p>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-rose-700 font-medium">
              Action: Prediction suppressed; redirected to conventional clinical workflow.
            </div>
          </div>
        </div>
      </section>

      {/* AI Architecture Pipeline */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-soft-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <div className="text-xs font-mono uppercase text-clinical-400 tracking-wider">
            Technical Methodology
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            ClinSure End-to-End AI Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            A principled multi-stage pipeline combining deep representation learning, statistical calibration, Bayesian approximation, and metric distance estimation.
          </p>
        </div>

        {/* Pipeline Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {[
            { step: '1', title: 'Chest X-Ray', sub: 'Input DICOM' },
            { step: '2', title: 'Feature Extraction', sub: 'DenseNet z ∈ R^d' },
            { step: '3', title: 'Classifier', sub: 'Softmax Logits' },
            { step: '4', title: 'Calibration', sub: 'Temp Scaling T' },
            { step: '5', title: 'MC-Dropout', sub: '25 Passes' },
            { step: '6', title: 'Epistemic Uncertainty', sub: 'Mutual Info I' },
            { step: '7', title: 'Mahalanobis OOD', sub: 'Gaussian Dist M' },
            { step: '8', title: 'Safety Triage', sub: 'Accept/Uncertain/Abstain' },
          ].map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
            >
              <span className="w-5 h-5 rounded-full bg-clinical-600 text-white text-[10px] font-bold mx-auto mb-1 flex items-center justify-center">
                {item.step}
              </span>
              <span className="font-semibold text-slate-200 text-[11px] leading-tight mb-1">
                {item.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Safety-First Philosophy */}
      <section className="text-center p-8 sm:p-12 rounded-3xl bg-clinical-50/60 border border-clinical-200/80 shadow-soft-sm space-y-4 max-w-4xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-clinical-600 text-white flex items-center justify-center mx-auto shadow-md shadow-clinical-600/30">
          <Scale className="w-6 h-6" />
        </div>
        <blockquote className="text-xl sm:text-2xl font-bold text-slate-900 max-w-xl mx-auto">
          &quot;Knowing when NOT to predict is part of intelligent AI.&quot;
        </blockquote>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ClinSure is built on the belief that safe clinical artificial intelligence must measure its own epistemic boundaries before offering diagnostic assistance.
        </p>

        <div className="pt-4">
          <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 shadow-soft-sm">
            <span className="font-semibold text-slate-700">Notice:</span>
            <span>ClinSure is a research/clinical decision-support prototype and does not replace professional medical judgment.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
