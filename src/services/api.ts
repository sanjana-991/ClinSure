import {
  AnalysisResult,
  AnalysisHistoryItem,
  DashboardStats,
  ModelMetrics,
  RobustnessMetrics,
  AnalysisStage
} from '../types';
import {
  DEMO_CASES,
  MOCK_HISTORY,
  MOCK_DASHBOARD_STATS,
  MOCK_MODEL_METRICS,
  MOCK_ROBUSTNESS_METRICS,
  SAMPLE_IMAGES
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Stage descriptions for multi-stage analysis workflow UI
 */
export const ANALYSIS_STAGES: { id: AnalysisStage; label: string; detail: string }[] = [
  { id: 'preprocessing', label: 'Image Preprocessing', detail: 'Normalizing pixel intensities, cropping thoracic ROI, resizing to 512x512' },
  { id: 'feature_extraction', label: 'Deep Feature Extraction', detail: 'Extracting penultimate feature embeddings z via DenseNet-121 backbone' },
  { id: 'classification', label: 'Pathology Classification', detail: 'Computing raw class logits for thoracic abnormalities' },
  { id: 'calibration', label: 'Probability Calibration', detail: 'Applying learned temperature scaling (T=1.18) to minimize ECE' },
  { id: 'mc_dropout', label: 'MC-Dropout Uncertainty Estimation', detail: 'Running 25 stochastic test-time passes to compute Mutual Information' },
  { id: 'ood_detection', label: 'Mahalanobis OOD Detection', detail: 'Calculating distance to class-conditional Gaussian centroids' },
  { id: 'decision', label: 'Safety Decision Engine', detail: 'Evaluating hierarchical triage criteria: Accept, Uncertain, or Abstain' }
];

/**
 * ClinSure API Service
 * Can toggle smoothly between the live FastAPI backend (when VITE_API_URL is provided)
 * and the local clinical simulation engine for offline research demo.
 */
class ApiService {
  private inMemoryHistory: AnalysisHistoryItem[] = [...MOCK_HISTORY];

  /**
   * Upload and analyze a chest X-ray file
   */
  async analyzeXRay(
    file: File | { name: string; type: string; dataUrl: string },
    presetCaseId?: string,
    onProgress?: (stage: AnalysisStage, percent: number) => void
  ): Promise<AnalysisResult> {
    // If live API endpoint configured, send multipart/form-data to FastAPI
    if (API_BASE_URL) {
      try {
        const formData = new FormData();
        if (file instanceof File) {
          formData.append('file', file);
        }
        if (presetCaseId) {
          formData.append('preset_id', presetCaseId);
        }

        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        console.warn('Live API call failed or unavailable, falling back to clinical demo simulator:', err);
      }
    }

    // Mock Simulation with progressive stage callbacks
    const stages: AnalysisStage[] = [
      'preprocessing',
      'feature_extraction',
      'classification',
      'calibration',
      'mc_dropout',
      'ood_detection',
      'decision'
    ];

    for (let i = 0; i < stages.length; i++) {
      if (onProgress) {
        onProgress(stages[i], Math.round(((i + 1) / stages.length) * 100));
      }
      // Realistic medical workstation computation delay per stage
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    // If a preset was requested (e.g. Case 001, 002, 003), return that high-fidelity result
    if (presetCaseId && DEMO_CASES[presetCaseId]) {
      const demoResult = { ...DEMO_CASES[presetCaseId] };
      this.recordInHistory(demoResult);
      return demoResult;
    }

    // Otherwise generate dynamic result based on uploaded file
    const isLikelyShift = file.name.toLowerCase().includes('shift') || file.name.toLowerCase().includes('ood') || file.name.toLowerCase().includes('icu');
    const isLikelyNormal = file.name.toLowerCase().includes('normal');
    
    let generatedResult: AnalysisResult;
    const newCaseId = `XR-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    if (isLikelyShift) {
      generatedResult = {
        id: newCaseId,
        timestamp,
        patientId: `PT-${Math.floor(Math.random() * 899999 + 100000)}`,
        patientAge: 64,
        patientSex: 'M',
        viewPosition: 'AP',
        hospitalSource: 'Hospital C (Regional Bedside ICU)',
        imageUri: SAMPLE_IMAGES.oodShift,
        decision: 'ABSTAIN',
        decisionHeadline: 'AI has abstained from making a reliable prediction',
        decisionDescription: 'Elevated Mahalanobis distance indicates distribution shift (scanner noise, motion blur, or foreign artifacts).',
        clinicalAction: 'Prediction withheld. Escalate to qualified radiologist.',
        primaryPrediction: 'Pneumonia (Withheld)',
        primaryProbability: 0.864,
        predictions: [
          { label: 'Pneumonia (Unreliable)', probability: 0.864, ciLower: 0.58, ciUpper: 0.93 },
          { label: 'Atelectasis (Unreliable)', probability: 0.092, ciLower: 0.03, ciUpper: 0.18 },
          { label: 'No Finding (Unreliable)', probability: 0.044, ciLower: 0.01, ciUpper: 0.09 }
        ],
        temperature: 1.18,
        calibrated: true,
        uncertainty: {
          epistemicUncertainty: 0.84,
          predictiveEntropy: 1.05,
          mcDropoutVariance: 0.58,
          aleatoricEntropy: 0.21,
          samplesCount: 25,
          level: 'High'
        },
        ood: {
          mahalanobisDistance: 2.05,
          oodThreshold: 1.50,
          status: 'Potential Out-of-Distribution Case',
          isOOD: true,
          featureNorm: 29.8
        },
        decisionFactors: [
          { factor: 'Distributional Familiarity', status: 'fail', description: 'Mahalanobis distance 2.05 exceeds threshold 1.50' },
          { factor: 'Epistemic Uncertainty', status: 'fail', description: 'High variance across MC-Dropout passes' },
          { factor: 'Overconfidence Mitigation', status: 'warning', description: 'Raw model predicted 86.4% confidence, but case was safely blocked' }
        ],
        processingTimeMs: 1540
      };
    } else if (isLikelyNormal) {
      generatedResult = {
        id: newCaseId,
        timestamp,
        patientId: `PT-${Math.floor(Math.random() * 899999 + 100000)}`,
        patientAge: 38,
        patientSex: 'F',
        viewPosition: 'PA',
        hospitalSource: 'Hospital A (Outpatient Diagnostic Imaging)',
        imageUri: SAMPLE_IMAGES.normal,
        decision: 'ACCEPT',
        decisionHeadline: 'Prediction considered sufficiently reliable',
        decisionDescription: 'Standard upright PA radiograph with clear anatomical structures and low epistemic uncertainty.',
        clinicalAction: 'Safe for automated draft documentation and clinical verification.',
        primaryPrediction: 'No Finding',
        primaryProbability: 0.962,
        predictions: [
          { label: 'No Finding', probability: 0.962, ciLower: 0.941, ciUpper: 0.981 },
          { label: 'Pneumonia', probability: 0.024, ciLower: 0.009, ciUpper: 0.041 },
          { label: 'Cardiomegaly', probability: 0.014, ciLower: 0.004, ciUpper: 0.025 }
        ],
        temperature: 1.18,
        calibrated: true,
        uncertainty: {
          epistemicUncertainty: 0.12,
          predictiveEntropy: 0.18,
          mcDropoutVariance: 0.04,
          aleatoricEntropy: 0.06,
          samplesCount: 25,
          level: 'Low'
        },
        ood: {
          mahalanobisDistance: 0.68,
          oodThreshold: 1.50,
          status: 'In-Distribution',
          isOOD: false,
          featureNorm: 13.2
        },
        decisionFactors: [
          { factor: 'Calibrated Confidence', status: 'pass', description: 'No Finding calibrated confidence is 96.2%' },
          { factor: 'Epistemic Uncertainty', status: 'pass', description: 'Minimal parameter uncertainty (0.12)' },
          { factor: 'Distributional Familiarity', status: 'pass', description: 'Conforms to in-distribution cluster geometry' }
        ],
        processingTimeMs: 1380
      };
    } else {
      // Default to high-confidence Pneumonia Accept case
      generatedResult = {
        id: newCaseId,
        timestamp,
        patientId: `PT-${Math.floor(Math.random() * 899999 + 100000)}`,
        patientAge: 54,
        patientSex: 'M',
        viewPosition: 'PA',
        hospitalSource: 'Hospital A (Metropolitan Academic Center)',
        imageUri: SAMPLE_IMAGES.pneumonia,
        decision: 'ACCEPT',
        decisionHeadline: 'Prediction considered sufficiently reliable',
        decisionDescription: 'Calibrated confidence exceeds clinical threshold with minimal epistemic uncertainty and verified in-distribution feature geometry.',
        clinicalAction: 'Eligible for automated pre-reporting and prioritized clinical queue.',
        primaryPrediction: 'Pneumonia',
        primaryProbability: 0.938,
        predictions: [
          { label: 'Pneumonia', probability: 0.938, ciLower: 0.908, ciUpper: 0.962 },
          { label: 'No Finding', probability: 0.042, ciLower: 0.021, ciUpper: 0.065 },
          { label: 'Pleural Effusion', probability: 0.014, ciLower: 0.006, ciUpper: 0.024 },
          { label: 'Cardiomegaly', probability: 0.006, ciLower: 0.001, ciUpper: 0.012 }
        ],
        temperature: 1.18,
        calibrated: true,
        uncertainty: {
          epistemicUncertainty: 0.19,
          predictiveEntropy: 0.26,
          mcDropoutVariance: 0.08,
          aleatoricEntropy: 0.07,
          samplesCount: 25,
          level: 'Low'
        },
        ood: {
          mahalanobisDistance: 0.85,
          oodThreshold: 1.50,
          status: 'In-Distribution',
          isOOD: false,
          featureNorm: 15.1
        },
        decisionFactors: [
          { factor: 'Calibrated Confidence', status: 'pass', description: 'Calibrated confidence (93.8%) meets criteria' },
          { factor: 'Epistemic Uncertainty', status: 'pass', description: 'MC-Dropout consensus is strong across passes' },
          { factor: 'Distributional Familiarity', status: 'pass', description: 'In-distribution Mahalanobis distance 0.85' }
        ],
        processingTimeMs: 1450
      };
    }

    this.recordInHistory(generatedResult);
    return generatedResult;
  }

  private recordInHistory(res: AnalysisResult) {
    const existingIndex = this.inMemoryHistory.findIndex((h) => h.id === res.id);
    const item: AnalysisHistoryItem = {
      id: res.id,
      timestamp: res.timestamp,
      patientId: res.patientId,
      prediction: res.primaryPrediction,
      confidence: res.primaryProbability,
      epistemicUncertainty: res.uncertainty.epistemicUncertainty,
      uncertaintyLevel: res.uncertainty.level,
      oodScore: res.ood.mahalanobisDistance,
      decision: res.decision,
      hospitalSource: res.hospitalSource
    };

    if (existingIndex >= 0) {
      this.inMemoryHistory[existingIndex] = item;
    } else {
      this.inMemoryHistory.unshift(item);
    }
  }

  /**
   * Retrieve a specific analysis result by Case ID
   */
  async getAnalysisResult(id: string): Promise<AnalysisResult> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/results/${id}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to fetch from live API, checking local store', e);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (DEMO_CASES[id]) {
      return DEMO_CASES[id];
    }

    const foundInHistory = this.inMemoryHistory.find((h) => h.id === id);
    if (foundInHistory) {
      // Return synthetic full record based on history entry
      return {
        ...DEMO_CASES['XR-2026-001'],
        id: foundInHistory.id,
        timestamp: foundInHistory.timestamp,
        patientId: foundInHistory.patientId,
        primaryPrediction: foundInHistory.prediction,
        primaryProbability: foundInHistory.confidence,
        decision: foundInHistory.decision,
        uncertainty: {
          ...DEMO_CASES['XR-2026-001'].uncertainty,
          epistemicUncertainty: foundInHistory.epistemicUncertainty,
          level: foundInHistory.uncertaintyLevel
        },
        ood: {
          ...DEMO_CASES['XR-2026-001'].ood,
          mahalanobisDistance: foundInHistory.oodScore,
          isOOD: foundInHistory.decision === 'ABSTAIN',
          status: foundInHistory.decision === 'ABSTAIN' ? 'Potential Out-of-Distribution Case' : 'In-Distribution'
        }
      };
    }

    // Default fallback to XR-2026-001
    return DEMO_CASES['XR-2026-001'];
  }

  /**
   * Get historical analyses
   */
  async getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/history`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to fetch history from live API, using mock', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...this.inMemoryHistory];
  }

  /**
   * Get dashboard summary statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to fetch stats from live API, using mock', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      ...MOCK_DASHBOARD_STATS,
      recentAnalyses: [...this.inMemoryHistory.slice(0, 10)]
    };
  }

  /**
   * Get research model metrics & calibration diagrams
   */
  async getModelMetrics(): Promise<ModelMetrics> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/model/metrics`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to fetch model metrics from live API, using mock', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_MODEL_METRICS;
  }

  /**
   * Get cross-hospital distribution shift and robustness data
   */
  async getRobustnessMetrics(): Promise<RobustnessMetrics> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/robustness/metrics`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to fetch robustness metrics from live API, using mock', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_ROBUSTNESS_METRICS;
  }
}

export const apiService = new ApiService();
