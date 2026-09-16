export type Decision = 'ACCEPT' | 'UNCERTAIN' | 'ABSTAIN';

export interface PredictionItem {
  label: string;
  probability: number; // e.g. 0.942
  ciLower: number;     // 95% Bayesian credible interval lower bound
  ciUpper: number;     // 95% Bayesian credible interval upper bound
}

export interface UncertaintyMetrics {
  epistemicUncertainty: number; // Mutual Information
  predictiveEntropy: number;    // Total predictive entropy
  mcDropoutVariance: number;    // Variance across MC passes
  aleatoricEntropy: number;     // Data uncertainty
  samplesCount: number;         // e.g. 25 MC passes
  level: 'Low' | 'Moderate' | 'High';
}

export interface OODMetrics {
  mahalanobisDistance: number;  // e.g. 0.82
  oodThreshold: number;         // e.g. 1.50
  status: 'In-Distribution' | 'Borderline Shift' | 'Potential Out-of-Distribution Case';
  isOOD: boolean;
  featureNorm?: number;
}

export interface DecisionFactor {
  factor: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  patientId: string;
  patientAge: number;
  patientSex: 'M' | 'F' | 'Other';
  viewPosition: 'PA' | 'AP' | 'Lateral';
  hospitalSource: string;
  imageUri: string;
  gradcamUri?: string;
  attentionUri?: string;
  decision: Decision;
  decisionHeadline: string;
  decisionDescription: string;
  clinicalAction: string;
  primaryPrediction: string;
  primaryProbability: number;
  predictions: PredictionItem[];
  temperature: number;
  calibrated: boolean;
  uncertainty: UncertaintyMetrics;
  ood: OODMetrics;
  decisionFactors: DecisionFactor[];
  isDemo?: boolean;
  processingTimeMs: number;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  patientId: string;
  prediction: string;
  confidence: number;
  epistemicUncertainty: number;
  uncertaintyLevel: 'Low' | 'Moderate' | 'High';
  oodScore: number;
  decision: Decision;
  hospitalSource: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  accepted: number;
  uncertain: number;
  abstained: number;
  averageConfidence: number;
  oodCases: number;
  decisionDistribution: { name: string; value: number; color: string }[];
  confidenceVsUncertainty: {
    id: string;
    confidence: number;
    uncertainty: number;
    decision: Decision;
    prediction: string;
  }[];
  recentAnalyses: AnalysisHistoryItem[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auroc: number;
  ece: number; // Expected Calibration Error
  calibrationData: {
    confidenceBin: string;
    predictedConfidence: number;
    observedAccuracy: number;
    count: number;
    perfectCalibration: number;
  }[];
  confidenceDistribution: {
    bin: string;
    count: number;
  }[];
  uncertaintyDistribution: {
    bin: string;
    count: number;
  }[];
  decisionBreakdown: {
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
}

export interface HospitalCohort {
  name: string;
  code: string;
  deviceType: string;
  sampleSize: number;
  accuracy: number;
  auroc: number;
  ece: number;
  avgUncertainty: number;
  oodDetectionRate: number;
  abstentionRate: number;
  isShifted: boolean;
  shiftType: string;
  description: string;
}

export interface RobustnessMetrics {
  hospitals: HospitalCohort[];
  uncertaintyByShift: {
    shiftLevel: string;
    inDistribution: number;
    acquisitionShift: number;
    artifactShift: number;
    farOod: number;
  }[];
  abstentionComparison: {
    cohort: string;
    accept: number;
    uncertain: number;
    abstain: number;
  }[];
}

export type AnalysisStage =
  | 'idle'
  | 'preprocessing'
  | 'feature_extraction'
  | 'classification'
  | 'calibration'
  | 'mc_dropout'
  | 'ood_detection'
  | 'decision'
  | 'complete'
  | 'error';
