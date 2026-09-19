import {
  AnalysisResult,
  AnalysisHistoryItem,
  DashboardStats,
  ModelMetrics,
  RobustnessMetrics,
  AnalysisStage,
  Decision,
  DecisionFactor,
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
 * Live results returned by the real FastAPI backend.
 *
 * ResultsPage uses this exact object so live results are never
 * rebuilt from demo/mock data.
 */
const inMemoryResults: Record<string, AnalysisResult> = {};


/**
 * Convert the upload-preview data URL back into a real File.
 */
async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  return new File(
    [blob],
    filename,
    {
      type: mimeType || blob.type,
    }
  );
}


/**
 * ClinSure analysis stages.
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
      'Converting the X-ray to RGB, resizing to 224x224, and applying training-set normalization',
  },
  {
    id: 'feature_extraction',
    label: 'Deep Feature Extraction',
    detail:
      'Extracting 1024-dimensional features from the DenseNet-121 backbone',
  },
  {
    id: 'classification',
    label: 'Pathology Classification',
    detail:
      'Computing class logits for 15 chest X-ray findings',
  },
  {
    id: 'calibration',
    label: 'Probability Calibration',
    detail:
      'Applying learned temperature scaling using the calibrated temperature from the backend',
  },
  {
    id: 'mc_dropout',
    label: 'MC-Dropout Uncertainty Estimation',
    detail:
      'Running stochastic passes to estimate predictive uncertainty',
  },
  {
    id: 'ood_detection',
    label: 'Mahalanobis OOD Detection',
    detail:
      'Measuring feature-space distance from the training distribution',
  },
  {
    id: 'decision',
    label: 'Safety Decision Engine',
    detail:
      'Evaluating calibrated confidence, uncertainty, OOD risk, and composite safety risk',
  },
];


class ApiService {
  private inMemoryHistory: AnalysisHistoryItem[] = [
    ...MOCK_HISTORY,
  ];


  /**
   * Upload and analyze a chest X-ray.
   */
  async analyzeXRay(
    file:
      | File
      | {
          name: string;
          type: string;
          dataUrl: string;
        },
    presetCaseId?: string,
    onProgress?: (
      stage: AnalysisStage,
      percent: number
    ) => void
  ): Promise<AnalysisResult> {

    const startTime = performance.now();

    void presetCaseId;


    // =========================================
    // NORMALIZE FILE
    // =========================================

    const actualFile: File =
      file instanceof File
        ? file
        : await dataUrlToFile(
            file.dataUrl,
            file.name,
            file.type
          );


    // =========================================
    // PREPROCESSING
    // =========================================

    onProgress?.(
      'preprocessing',
      15
    );


    const formData = new FormData();

    formData.append(
      'file',
      actualFile
    );


    try {

      // =========================================
      // FEATURE EXTRACTION
      // =========================================

      onProgress?.(
        'feature_extraction',
        30
      );


      if (!API_BASE_URL) {
        throw new Error(
          'VITE_API_URL is not configured. Please set the FastAPI server URL in .env.'
        );
      }


      // =========================================
      // SEND TO FASTAPI
      // =========================================

      const response = await fetch(
        `${API_BASE_URL}/predict`,
        {
          method: 'POST',
          body: formData,
        }
      );


      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          `Prediction API error (${response.status}): ${errorText}`
        );
      }


      // =========================================
      // CLASSIFICATION
      // =========================================

      onProgress?.(
        'classification',
        50
      );


      const result =
        await response.json();


      // =========================================
      // CALIBRATION
      // =========================================

      onProgress?.(
        'calibration',
        65
      );


      // =========================================
      // MC DROPOUT
      // =========================================

      onProgress?.(
        'mc_dropout',
        78
      );


      // =========================================
      // OOD
      // =========================================

      onProgress?.(
        'ood_detection',
        90
      );


      // =========================================
      // READ BACKEND VALUES
      // =========================================

      const prediction =
        String(
          result.prediction ??
          'Unknown'
        );


      const confidence =
        Number(
          result.confidence ?? 0
        );


      const temperature =
        Number(
          result.temperature ?? 1
        );


      const uncertainty =
        Number(
          result.uncertainty ?? 0
        );


      const entropy =
        Number(
          result.entropy ?? 0
        );


      const oodScore =
        Number(
          result.ood_score ?? 0
        );


      const compositeRisk =
        Number(
          result.composite_risk ?? 0
        );


      const acceptThreshold =
        Number(
          result.accept_threshold ?? 0
        );


      const uncertainThreshold =
        Number(
          result.uncertain_threshold ?? 0
        );


      const samplesCount =
        Number(
          result.mc_dropout_passes ?? 10
        );


      const calibrated =
        result.calibrated !== false;


      const decision: Decision =
        result.decision === 'ACCEPT' ||
        result.decision === 'UNCERTAIN' ||
        result.decision === 'ABSTAIN'
          ? result.decision
          : 'ABSTAIN';


      // =========================================
      // FULL 15-CLASS PROBABILITY DISTRIBUTION
      // =========================================

      const backendProbabilities =
        result.probabilities ?? {};


      const predictions = Object.entries(
        backendProbabilities
      )
        .map(
          ([label, value]) => {

            const probability =
              Number(value);

            return {
              label,
              probability,

              /*
               * The backend currently does not return
               * confidence intervals.
               *
               * Therefore we do NOT invent a CI.
               * The displayed bounds equal the actual
               * probability until CI calculation is
               * implemented by the backend.
               */
              ciLower: probability,
              ciUpper: probability,
            };
          }
        )
        .sort(
          (a, b) =>
            b.probability -
            a.probability
        );


      // Safety fallback if backend probabilities
      // are unexpectedly missing.
      if (predictions.length === 0) {

        predictions.push({
          label: prediction,
          probability: confidence,
          ciLower: confidence,
          ciUpper: confidence,
        });
      }


      // =========================================
      // IMAGE PREVIEW
      // =========================================

      const imageUri =
        URL.createObjectURL(
          actualFile
        );


      // =========================================
      // UNCERTAINTY LEVEL
      // =========================================

      let uncertaintyLevel:
        | 'Low'
        | 'Moderate'
        | 'High';


      if (uncertainty < 0.0002) {

        uncertaintyLevel =
          'Low';

      } else if (
        uncertainty < 0.0005
      ) {

        uncertaintyLevel =
          'Moderate';

      } else {

        uncertaintyLevel =
          'High';
      }


      // =========================================
      // DECISION TEXT
      // =========================================

      const decisionHeadline =
        decision === 'ACCEPT'
          ? 'Prediction passed the configured safety threshold'
          : decision === 'UNCERTAIN'
          ? 'Prediction requires additional review'
          : 'AI has abstained from making a reliable prediction';


      const decisionDescription =
        decision === 'ACCEPT'
          ? `Composite risk ${compositeRisk.toFixed(4)} is within the configured ACCEPT threshold of ${acceptThreshold.toFixed(4)}.`
          : decision === 'UNCERTAIN'
          ? `Composite risk ${compositeRisk.toFixed(4)} falls between the configured ACCEPT and UNCERTAIN thresholds.`
          : `Composite risk ${compositeRisk.toFixed(4)} exceeds the configured UNCERTAIN threshold of ${uncertainThreshold.toFixed(4)}.`;


      const clinicalAction =
        decision === 'ACCEPT'
          ? 'Prediction may be used as an automated draft and should still be clinically verified.'
          : decision === 'UNCERTAIN'
          ? 'Review the X-ray and model output before relying on the prediction.'
          : 'Prediction withheld. Escalate to a qualified radiologist.';


      // =========================================
      // DECISION FACTORS
      // =========================================

      const decisionFactors: DecisionFactor[] = [

        {
          factor:
            'Calibrated Confidence',

          /*
           * No independent confidence threshold is
           * configured in the backend.
           *
           * Therefore this factor is informational,
           * not a fabricated pass/fail safety rule.
           */
          status:
            'warning',

          description:
            `Calibrated confidence: ${(confidence * 100).toFixed(1)}%`,
        },


        {
          factor:
            'MC-Dropout Uncertainty',

          /*
           * The backend computes this value directly.
           * We report it without inventing a safety
           * threshold.
           */
          status:
            uncertaintyLevel === 'High'
              ? 'fail'
              : uncertaintyLevel === 'Moderate'
              ? 'warning'
              : 'pass',

          description:
            `Uncertainty: ${uncertainty.toFixed(6)} across ${samplesCount} stochastic passes`,
        },


        {
          factor:
            'Mahalanobis OOD Distance',

          /*
           * No OOD threshold is configured in the
           * current backend, so we cannot truthfully
           * label this score pass/fail.
           */
          status:
            'warning',

          description:
            `Mahalanobis distance: ${oodScore.toFixed(2)} • threshold not configured`,
        },


        {
          factor:
            'Composite Safety Risk',

          status:
            compositeRisk <=
            acceptThreshold
              ? 'pass'
              : compositeRisk <=
                uncertainThreshold
              ? 'warning'
              : 'fail',

          description:
            `Risk: ${compositeRisk.toFixed(4)} • ACCEPT ≤ ${acceptThreshold.toFixed(4)} • UNCERTAIN ≤ ${uncertainThreshold.toFixed(4)}`,
        },
      ];


      // =========================================
      // OOD STATUS
      // =========================================

      /*
       * IMPORTANT:
       *
       * An ABSTAIN decision does NOT automatically
       * mean the image is OOD.
       *
       * The current backend calculates a Mahalanobis
       * distance but does not configure/return an OOD
       * threshold.
       */

      const oodStatus =
        'Potential Out-of-Distribution Case';


      // We cannot truthfully say isOOD=true
      // without an actual configured OOD threshold.
      const isOOD = false;


      // =========================================
      // ANALYSIS RESULT
      // =========================================

      const analysisResult: AnalysisResult = {

        id:
          `XR-${Date.now()}`,


        timestamp:
          new Date()
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19) +
          ' UTC',


        patientId:
          'Not provided',


        patientAge:
          0,


        patientSex:
          'Other',


        viewPosition:
          'PA',


        hospitalSource:
          'Uploaded X-ray',


        imageUri,


        decision,


        decisionHeadline,


        decisionDescription,


        clinicalAction,


        primaryPrediction:
          prediction,


        primaryProbability:
          confidence,


        predictions,


        temperature,


        calibrated,


        uncertainty: {

          epistemicUncertainty:
            uncertainty,

          predictiveEntropy:
            entropy,

          mcDropoutVariance:
            uncertainty,

          aleatoricEntropy:
            0,

          samplesCount,

          level:
            uncertaintyLevel,
        },


        ood: {

          mahalanobisDistance:
            oodScore,

          /*
           * 0 is retained only as a compatibility
           * sentinel because AnalysisResult currently
           * expects a number.
           *
           * It must NOT be interpreted as a real
           * OOD threshold.
           */
          oodThreshold:
            0,

          status:
            oodStatus,

          isOOD,
        },


        decisionFactors,


        isDemo:
          false,


        processingTimeMs:
          Math.round(
            performance.now() -
            startTime
          ),
      };


      // =========================================
      // STORE EXACT LIVE RESULT
      // =========================================

      inMemoryResults[
        analysisResult.id
      ] = analysisResult;


      // =========================================
      // HISTORY
      // =========================================

      this.recordInHistory(
        analysisResult
      );


      // =========================================
      // COMPLETE
      // =========================================

      onProgress?.(
        'decision',
        100
      );


      onProgress?.(
        'complete',
        100
      );


      return analysisResult;


    } catch (error) {

      console.error(
        'FastAPI prediction failed:',
        error
      );


      onProgress?.(
        'error',
        100
      );


      throw new Error(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the ClinSure prediction server.'
      );
    }
  }


  // =========================================
  // HISTORY
  // =========================================

  private recordInHistory(
    res: AnalysisResult
  ) {

    const existingIndex =
      this.inMemoryHistory.findIndex(
        (h) =>
          h.id === res.id
      );


    const item:
      AnalysisHistoryItem = {

      id:
        res.id,

      timestamp:
        res.timestamp,

      patientId:
        res.patientId,

      prediction:
        res.primaryPrediction,

      confidence:
        res.primaryProbability,

      epistemicUncertainty:
        res.uncertainty
          .epistemicUncertainty,

      uncertaintyLevel:
        res.uncertainty.level,

      oodScore:
        res.ood
          .mahalanobisDistance,

      decision:
        res.decision,

      hospitalSource:
        res.hospitalSource,
    };


    if (
      existingIndex >= 0
    ) {

      this.inMemoryHistory[
        existingIndex
      ] = item;

    } else {

      this.inMemoryHistory.unshift(
        item
      );
    }
  }


  // =========================================
  // GET ANALYSIS RESULT
  // =========================================

  async getAnalysisResult(
    id: string
  ): Promise<AnalysisResult> {

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          200
        )
    );


    // 1. Exact live result
    if (
      inMemoryResults[id]
    ) {

      return inMemoryResults[id];
    }


    // 2. Explicit demo case
    if (
      DEMO_CASES[id]
    ) {

      return DEMO_CASES[id];
    }


    // 3. History fallback
    const foundInHistory =
      this.inMemoryHistory.find(
        (h) =>
          h.id === id
      );


    if (
      foundInHistory
    ) {

      const confidence =
        foundInHistory.confidence;


      const uncertainty =
        foundInHistory
          .epistemicUncertainty;


      const decision =
        foundInHistory.decision;


      return {

        id:
          foundInHistory.id,

        timestamp:
          foundInHistory.timestamp,

        patientId:
          foundInHistory.patientId,

        patientAge:
          0,

        patientSex:
          'Other',

        viewPosition:
          'PA',

        hospitalSource:
          foundInHistory.hospitalSource,

        imageUri:
          '',

        decision,

        decisionHeadline:
          decision === 'ACCEPT'
            ? 'Prediction passed the configured safety threshold'
            : decision === 'UNCERTAIN'
            ? 'Prediction requires additional review'
            : 'AI has abstained from making a reliable prediction',

        decisionDescription:
          'Historical live result. Detailed backend metrics are not persisted by the current frontend session.',

        clinicalAction:
          decision === 'ACCEPT'
            ? 'Prediction may be used as an automated draft and should still be clinically verified.'
            : decision === 'UNCERTAIN'
            ? 'Review the X-ray and model output before relying on the prediction.'
            : 'Prediction withheld. Escalate to a qualified radiologist.',

        primaryPrediction:
          foundInHistory.prediction,

        primaryProbability:
          confidence,

        predictions: [
          {
            label:
              foundInHistory.prediction,

            probability:
              confidence,

            ciLower:
              confidence,

            ciUpper:
              confidence,
          },
        ],

        /*
         * Historical records do not persist the
         * complete backend calibration metadata.
         */
        temperature:
          1.0136176347732544,

        calibrated:
          true,

        uncertainty: {

          epistemicUncertainty:
            uncertainty,

          predictiveEntropy:
            0,

          mcDropoutVariance:
            uncertainty,

          aleatoricEntropy:
            0,

          samplesCount:
            10,

          level:
            foundInHistory
              .uncertaintyLevel,
        },

        ood: {

          mahalanobisDistance:
            foundInHistory
              .oodScore,

          oodThreshold:
            0,

          status:
            'Potential Out-of-Distribution Case',

          isOOD:
            false,
        },

        decisionFactors:
          [],

        isDemo:
          false,

        processingTimeMs:
          0,
      };
    }


    throw new Error(
      `Analysis result not found: ${id}`
    );
  }


  // =========================================
  // ANALYSIS HISTORY
  // =========================================

  async getAnalysisHistory(): Promise<
    AnalysisHistoryItem[]
  > {

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          200
        )
    );


    return [
      ...this.inMemoryHistory,
    ];
  }


  // =========================================
  // DASHBOARD
  // =========================================

  async getDashboardStats(): Promise<
    DashboardStats
  > {

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );


    return {

      ...MOCK_DASHBOARD_STATS,

      recentAnalyses:
        [
          ...this.inMemoryHistory.slice(
            0,
            10
          ),
        ],
    };
  }


  // =========================================
  // MODEL METRICS
  // =========================================

  async getModelMetrics(): Promise<
    ModelMetrics
  > {

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );


    return MOCK_MODEL_METRICS;
  }


  // =========================================
  // ROBUSTNESS METRICS
  // =========================================

  async getRobustnessMetrics(): Promise<
    RobustnessMetrics
  > {

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );


    return MOCK_ROBUSTNESS_METRICS;
  }
}


export const apiService =
  new ApiService();