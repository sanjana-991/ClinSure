import {
  AnalysisResult,
  AnalysisHistoryItem,
  DashboardStats,
  ModelMetrics,
  RobustnessMetrics,
  AnalysisStage,
  Decision,
  DecisionFactor
} from '../types';

import {
  DEMO_CASES,
  MOCK_HISTORY,
  MOCK_DASHBOARD_STATS,
  MOCK_MODEL_METRICS,
  MOCK_ROBUSTNESS_METRICS,
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * The upload UI may build a { name, type, dataUrl } object via
 * FileReader.readAsDataURL() purely for image preview purposes.
 * This converts that back into a real File so it can be sent as
 * multipart/form-data to FastAPI.
 */
async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type });
}

/**
 * ClinSure analysis stages
 *
 * These descriptions reflect the actual ML pipeline:
 * - 224x224 preprocessing
 * - DenseNet-121
 * - Temperature scaling
 * - 10 stochastic uncertainty passes
 * - Mahalanobis OOD detection
 * - ACCEPT / UNCERTAIN / ABSTAIN decision layer
 */
export const ANALYSIS_STAGES: {
  id: AnalysisStage;
  label: string;
  detail: string;
}[] = [
  {
    id: 'preprocessing',
    label: 'Image Preprocessing',
    detail:
      'Converting the X-ray to RGB, resizing to 224x224, and applying training-set normalization'
  },
  {
    id: 'feature_extraction',
    label: 'Deep Feature Extraction',
    detail:
      'Extracting 1024-dimensional features from the DenseNet-121 backbone'
  },
  {
    id: 'classification',
    label: 'Pathology Classification',
    detail:
      'Computing class logits for 15 chest X-ray findings'
  },
  {
    id: 'calibration',
    label: 'Probability Calibration',
    detail:
      'Applying learned temperature scaling with T=1.0136'
  },
  {
    id: 'mc_dropout',
    label: 'MC-Dropout Uncertainty Estimation',
    detail:
      'Running 10 stochastic passes to estimate predictive uncertainty'
  },
  {
    id: 'ood_detection',
    label: 'Mahalanobis OOD Detection',
    detail:
      'Measuring feature-space distance from the training distribution'
  },
  {
    id: 'decision',
    label: 'Safety Decision Engine',
    detail:
      'Evaluating calibrated confidence, uncertainty, and OOD risk for ACCEPT, UNCERTAIN, or ABSTAIN'
  }
];

/**
 * ClinSure API Service
 *
 * The X-ray analysis uses the real FastAPI /predict endpoint
 * when VITE_API_URL is configured.
 *
 * Other dashboard/history functions currently retain their
 * local/mock fallback because those backend endpoints are not
 * part of the current FastAPI service.
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
    const startTime = performance.now();

    // Normalize whatever the upload UI passed into a real File. Native
    // <input type="file"> / drag-drop already gives us a File; the preview
    // flow gives us a { name, type, dataUrl } object instead — convert that
    // back into binary file data so FastAPI receives an actual upload.
    const actualFile: File =
      file instanceof File
        ? file
        : await dataUrlToFile(file.dataUrl, file.name, file.type);

    // -----------------------------------------
    // 1. PREPROCESSING
    // -----------------------------------------
    onProgress?.('preprocessing', 15);

    const formData = new FormData();
    formData.append('file', actualFile);

    try {
      // -----------------------------------------
      // 2. FEATURE EXTRACTION
      // -----------------------------------------
      onProgress?.('feature_extraction', 30);

      if (!API_BASE_URL) {
        throw new Error(
          'VITE_API_URL is not configured. Please set the FastAPI server URL in .env.local.'
        );
      }

      // -----------------------------------------
      // SEND IMAGE TO FASTAPI
      // -----------------------------------------
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Prediction API error (${response.status}): ${errorText}`
        );
      }

      // -----------------------------------------
      // 3. CLASSIFICATION
      // -----------------------------------------
      onProgress?.('classification', 50);

      const result = await response.json();

      // -----------------------------------------
      // 4. CALIBRATION
      // -----------------------------------------
      onProgress?.('calibration', 65);

      // -----------------------------------------
      // 5. MC-DROPOUT
      // -----------------------------------------
      onProgress?.('mc_dropout', 78);

      // -----------------------------------------
      // 6. OOD DETECTION
      // -----------------------------------------
      onProgress?.('ood_detection', 90);

      /*
       * Expected FastAPI response:
       *
       * {
       *   prediction,
       *   confidence,
       *   uncertainty,
       *   entropy,
       *   ood_score,
       *   composite_risk,
       *   decision
       * }
       */

      const prediction = String(result.prediction ?? 'Unknown');

      const confidence = Number(
        result.confidence ?? 0
      );

      const uncertainty = Number(
        result.uncertainty ?? 0
      );

      const entropy = Number(
        result.entropy ?? 0
      );

      const oodScore = Number(
        result.ood_score ?? 0
      );

      const compositeRisk = Number(
        result.composite_risk ?? 0
      );

      const decision: Decision =
        result.decision === 'ACCEPT' ||
        result.decision === 'UNCERTAIN' ||
        result.decision === 'ABSTAIN'
          ? result.decision
          : 'ABSTAIN';

      // -----------------------------------------
      // DISPLAY UPLOADED IMAGE
      // -----------------------------------------
      const imageUri = URL.createObjectURL(actualFile);

      // -----------------------------------------
      // UNCERTAINTY LEVEL
      // -----------------------------------------
      let uncertaintyLevel:
        | 'Low'
        | 'Moderate'
        | 'High';

      if (uncertainty < 0.0002) {
        uncertaintyLevel = 'Low';
      } else if (uncertainty < 0.0005) {
        uncertaintyLevel = 'Moderate';
      } else {
        uncertaintyLevel = 'High';
      }

      // -----------------------------------------
      // DECISION TEXT
      // -----------------------------------------
      const decisionHeadline =
        decision === 'ACCEPT'
          ? 'Prediction considered sufficiently reliable'
          : decision === 'UNCERTAIN'
          ? 'Prediction requires additional review'
          : 'AI has abstained from making a reliable prediction';

      const decisionDescription =
        decision === 'ACCEPT'
          ? 'The calibrated model prediction passed the current safety decision thresholds.'
          : decision === 'UNCERTAIN'
          ? 'The model identified sufficient uncertainty that additional clinical review is recommended.'
          : 'The safety layer withheld the prediction because the case did not meet the required reliability criteria.';

      const clinicalAction =
        decision === 'ACCEPT'
          ? 'Prediction may be used as an automated draft and should still be clinically verified.'
          : decision === 'UNCERTAIN'
          ? 'Review the X-ray and model output before relying on the prediction.'
          : 'Prediction withheld. Escalate to a qualified radiologist.';

      // -----------------------------------------
      // DECISION FACTORS
      // -----------------------------------------
      const decisionFactors: DecisionFactor[] = [
        {
          factor: 'Calibrated Confidence',
          status:
            confidence >= 0.8
              ? 'pass'
              : confidence >= 0.5
              ? 'warning'
              : 'fail',
          description:
            `Model confidence: ${(confidence * 100).toFixed(1)}%`,
        },

        {
          factor: 'MC-Dropout Uncertainty',
          status:
            uncertainty < 0.0002
              ? 'pass'
              : uncertainty < 0.0005
              ? 'warning'
              : 'fail',
          description:
            `Uncertainty score: ${uncertainty.toFixed(6)}`,
        },

        {
          factor: 'Mahalanobis OOD Score',
          status:
            oodScore < 1000
              ? 'pass'
              : oodScore < 2000
              ? 'warning'
              : 'fail',
          description:
            `OOD score: ${oodScore.toFixed(2)}`,
        },

        {
          factor: 'Composite Safety Risk',
          status:
            compositeRisk <= 0.1015
              ? 'pass'
              : compositeRisk <= 0.152
              ? 'warning'
              : 'fail',
          description:
            `Composite risk: ${compositeRisk.toFixed(4)}`,
        },
      ];

      // -----------------------------------------
      // ANALYSIS RESULT
      // -----------------------------------------
      const analysisResult: AnalysisResult = {
        id: `XR-${Date.now()}`,

        timestamp:
          new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19) + ' UTC',

        /*
         * The current /predict endpoint does not return
         * patient metadata.
         */
        patientId: 'Not provided',
        patientAge: 0,
        patientSex: 'Other',
        viewPosition: 'PA',
        hospitalSource: 'Uploaded X-ray',

        imageUri,

        decision,

        decisionHeadline,

        decisionDescription,

        clinicalAction,

        primaryPrediction: prediction,

        primaryProbability: confidence,

        /*
         * Current FastAPI endpoint returns the top prediction
         * rather than the complete 15-class probability vector.
         */
        predictions: [
          {
            label: prediction,
            probability: confidence,
            ciLower: confidence,
            ciUpper: confidence,
          },
        ],

        /*
         * Learned temperature from validation calibration.
         */
        temperature: 1.0136176347732544,

        calibrated: true,

        // -----------------------------------------
        // UNCERTAINTY
        // -----------------------------------------
        uncertainty: {
          epistemicUncertainty: uncertainty,
          predictiveEntropy: entropy,

          /*
           * The backend currently exposes the uncertainty
           * value rather than a separately named variance.
           */
          mcDropoutVariance: uncertainty,

          aleatoricEntropy: 0,

          samplesCount: 10,

          level: uncertaintyLevel,
        },

        // -----------------------------------------
        // OOD
        // -----------------------------------------
        ood: {
          mahalanobisDistance: oodScore,

          /*
           * The current backend does not expose the
           * internal OOD threshold, so we do not claim
           * a numeric threshold here.
           */
          oodThreshold: 0,

          /*
           * ABSTAIN is a safety decision, not necessarily
           * proof of OOD. Therefore this status is based
           * conservatively on the decision state.
           */
          status:
            decision === 'ABSTAIN'
              ? 'Potential Out-of-Distribution Case'
              : decision === 'UNCERTAIN'
              ? 'Borderline Shift'
              : 'In-Distribution',

          isOOD: decision === 'ABSTAIN',
        },

        decisionFactors,

        isDemo: false,

        processingTimeMs:
          Math.round(performance.now() - startTime),
      };

      // -----------------------------------------
      // COMPLETE
      // -----------------------------------------
      onProgress?.('decision', 100);
      onProgress?.('complete', 100);

      // Save locally for the current session.
      this.recordInHistory(analysisResult);

      return analysisResult;

    } catch (error) {
      console.error(
        'FastAPI prediction failed:',
        error
      );

      onProgress?.('error', 100);

      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the ClinSure prediction server.'
      );
    }
  }

  /**
   * Store analysis in the current browser session.
   */
  private recordInHistory(
    res: AnalysisResult
  ) {
    const existingIndex =
      this.inMemoryHistory.findIndex(
        (h) => h.id === res.id
      );

    const item: AnalysisHistoryItem = {
      id: res.id,

      timestamp: res.timestamp,

      patientId: res.patientId,

      prediction: res.primaryPrediction,

      confidence: res.primaryProbability,

      epistemicUncertainty:
        res.uncertainty.epistemicUncertainty,

      uncertaintyLevel:
        res.uncertainty.level,

      oodScore:
        res.ood.mahalanobisDistance,

      decision: res.decision,

      hospitalSource:
        res.hospitalSource,
    };

    if (existingIndex >= 0) {
      this.inMemoryHistory[existingIndex] = item;
    } else {
      this.inMemoryHistory.unshift(item);
    }
  }

  /**
   * Retrieve a specific analysis result.
   *
   * The current FastAPI backend does not have
   * a persistent /api/results endpoint, so the
   * frontend uses the current session/demo data.
   */
  async getAnalysisResult(
    id: string
  ): Promise<AnalysisResult> {

    await new Promise((resolve) =>
      setTimeout(resolve, 200)
    );

    if (DEMO_CASES[id]) {
      return DEMO_CASES[id];
    }

    const foundInHistory =
      this.inMemoryHistory.find(
        (h) => h.id === id
      );

    if (foundInHistory) {
      return {
        ...DEMO_CASES['XR-2026-001'],

        id: foundInHistory.id,

        timestamp:
          foundInHistory.timestamp,

        patientId:
          foundInHistory.patientId,

        primaryPrediction:
          foundInHistory.prediction,

        primaryProbability:
          foundInHistory.confidence,

        decision:
          foundInHistory.decision,

        uncertainty: {
          ...DEMO_CASES['XR-2026-001'].uncertainty,

          epistemicUncertainty:
            foundInHistory.epistemicUncertainty,

          level:
            foundInHistory.uncertaintyLevel,
        },

        ood: {
          ...DEMO_CASES['XR-2026-001'].ood,

          mahalanobisDistance:
            foundInHistory.oodScore,

          isOOD:
            foundInHistory.decision === 'ABSTAIN',

          status:
            foundInHistory.decision === 'ABSTAIN'
              ? 'Potential Out-of-Distribution Case'
              : 'In-Distribution',
        },
      };
    }

    return DEMO_CASES['XR-2026-001'];
  }

  /**
   * Get analysis history.
   *
   * Currently uses the local in-memory session history.
   */
    /**
   * Get analysis history.
   *
   * Currently uses the local in-memory session history.
   */
  async getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
    await new Promise((resolve) =>
      setTimeout(resolve, 200)
    );

    return [...this.inMemoryHistory];
  }

  /**
   * Get dashboard statistics.
   *
   * Currently uses the existing mock dashboard
   * data with the current session history.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );

    return {
      ...MOCK_DASHBOARD_STATS,

      recentAnalyses:
        [...this.inMemoryHistory.slice(0, 10)],
    };
  }

  /**
   * Get research model metrics.
   *
   * The current FastAPI backend does not expose
   * a model-metrics endpoint, so the existing
   * frontend mock data is retained here.
   */
  async getModelMetrics(): Promise<ModelMetrics> {
    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );

    return MOCK_MODEL_METRICS;
  }

  /**
   * Get robustness metrics.
   *
   * The current FastAPI backend does not expose
   * a robustness endpoint, so the existing
   * frontend mock data is retained here.
   */
  async getRobustnessMetrics(): Promise<RobustnessMetrics> {
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

    return MOCK_ROBUSTNESS_METRICS;
  }
}

export const apiService = new ApiService();