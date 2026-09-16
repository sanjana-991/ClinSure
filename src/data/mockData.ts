import { 
  AnalysisResult, 
  AnalysisHistoryItem, 
  DashboardStats, 
  ModelMetrics, 
  RobustnessMetrics 
} from '../types';

// High-fidelity SVG-based Chest X-ray visualizations for zero external image dependency
export const SAMPLE_IMAGES = {
  normal: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="%230a0e17"/>
    <ellipse cx="200" cy="220" rx="150" ry="170" fill="%23111827" stroke="%231f2937" stroke-width="4"/>
    <!-- Spine and mediastinum -->
    <rect x="190" y="40" width="20" height="320" fill="%239ca3af" opacity="0.4" rx="4"/>
    <path d="M170 140 Q200 120 230 140 T220 280 Q200 300 180 280 Z" fill="%23e5e7eb" opacity="0.3"/>
    <!-- Left lung field -->
    <path d="M175 90 C120 100 80 150 80 230 C80 290 120 320 165 310 C175 280 175 140 175 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <!-- Right lung field -->
    <path d="M225 90 C280 100 320 150 320 230 C320 290 280 320 235 310 C225 280 225 140 225 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <!-- Rib arcs -->
    <path d="M90 140 Q150 160 190 150 M210 150 Q250 160 310 140" stroke="%23d1d5db" stroke-width="3" fill="none" opacity="0.4"/>
    <path d="M85 180 Q150 200 190 190 M210 190 Q250 200 315 180" stroke="%23d1d5db" stroke-width="3.5" fill="none" opacity="0.4"/>
    <path d="M85 220 Q150 240 190 230 M210 230 Q250 240 315 220" stroke="%23d1d5db" stroke-width="4" fill="none" opacity="0.4"/>
    <path d="M90 260 Q150 280 190 270 M210 270 Q250 280 310 260" stroke="%23d1d5db" stroke-width="4" fill="none" opacity="0.35"/>
    <!-- Heart silhouette -->
    <path d="M170 210 Q140 260 180 295 Q200 300 220 280 Q210 230 190 200 Z" fill="%23f3f4f6" opacity="0.5"/>
    <!-- Clavicles -->
    <path d="M70 70 Q130 90 190 85 M210 85 Q270 90 330 70" stroke="%23e5e7eb" stroke-width="5" fill="none" opacity="0.6"/>
    <text x="20" y="380" fill="%236b7280" font-family="monospace" font-size="12">CHEST PA ERECT - IN-DISTRIBUTION [HOSP-A]</text>
  </svg>`,

  pneumonia: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="%230a0e17"/>
    <ellipse cx="200" cy="220" rx="150" ry="170" fill="%23111827" stroke="%231f2937" stroke-width="4"/>
    <!-- Spine and mediastinum -->
    <rect x="190" y="40" width="20" height="320" fill="%239ca3af" opacity="0.4" rx="4"/>
    <!-- Left lung (Patient Right - Infiltrate in lower lobe) -->
    <path d="M175 90 C120 100 80 150 80 230 C80 290 120 320 165 310 C175 280 175 140 175 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <!-- Consolidation / Opacity in Right Base -->
    <ellipse cx="130" cy="260" rx="38" ry="32" fill="%23f3f4f6" opacity="0.75" filter="blur(8px)"/>
    <circle cx="140" cy="245" r="22" fill="%23e5e7eb" opacity="0.6" filter="blur(5px)"/>
    <!-- Right lung field -->
    <path d="M225 90 C280 100 320 150 320 230 C320 290 280 320 235 310 C225 280 225 140 225 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <!-- Rib arcs -->
    <path d="M90 140 Q150 160 190 150 M210 150 Q250 160 310 140" stroke="%23d1d5db" stroke-width="3" fill="none" opacity="0.4"/>
    <path d="M85 180 Q150 200 190 190 M210 190 Q250 200 315 180" stroke="%23d1d5db" stroke-width="3.5" fill="none" opacity="0.4"/>
    <path d="M85 220 Q150 240 190 230 M210 230 Q250 240 315 220" stroke="%23d1d5db" stroke-width="4" fill="none" opacity="0.4"/>
    <!-- Heart shadow -->
    <path d="M170 210 Q140 260 180 295 Q200 300 220 280 Q210 230 190 200 Z" fill="%23f3f4f6" opacity="0.5"/>
    <!-- Clavicles -->
    <path d="M70 70 Q130 90 190 85 M210 85 Q270 90 330 70" stroke="%23e5e7eb" stroke-width="5" fill="none" opacity="0.6"/>
    <text x="20" y="380" fill="%23ef4444" font-family="monospace" font-size="12">CHEST PA - RIGHT BASILAR CONSOLIDATION</text>
  </svg>`,

  cardiomegaly: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="%230a0e17"/>
    <ellipse cx="200" cy="220" rx="150" ry="170" fill="%23111827" stroke="%231f2937" stroke-width="4"/>
    <rect x="190" y="40" width="20" height="320" fill="%239ca3af" opacity="0.4" rx="4"/>
    <!-- Lungs narrowed by enlarged heart silhouette -->
    <path d="M175 90 C120 100 80 150 80 230 C80 290 120 320 150 310 C160 280 175 140 175 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <path d="M225 90 C280 100 320 150 320 230 C320 290 280 320 245 310 C235 280 225 140 225 90 Z" fill="%23030712" stroke="%234b5563" stroke-width="2"/>
    <!-- Markedly enlarged cardiac silhouette CTR > 0.65 -->
    <path d="M150 180 C100 230 110 300 190 315 C260 315 280 270 240 200 C210 170 180 170 150 180 Z" fill="%23f3f4f6" opacity="0.65" stroke="%23e5e7eb" stroke-width="2"/>
    <text x="20" y="380" fill="%23f59e0b" font-family="monospace" font-size="12">CARDIOMEGALY - INCREASED CTR &gt; 0.62</text>
  </svg>`,

  oodShift: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="%231f2937"/>
    <!-- Heavy acquisition noise / scanner grid shift / metallic pacemaker and lines -->
    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23374151" stroke-width="0.7"/>
    </pattern>
    <rect width="400" height="400" fill="url(%23grid)" opacity="0.8"/>
    <!-- Distorted thoracic anatomy / foreign hardware -->
    <ellipse cx="200" cy="200" rx="140" ry="140" fill="%23111827" stroke="%239ca3af" stroke-width="2"/>
    <!-- Dual-chamber pacemaker artifact -->
    <rect x="75" y="85" width="45" height="35" rx="8" fill="%23ffffff" stroke="%23e5e7eb" stroke-width="2"/>
    <path d="M100 120 C120 180 150 220 185 270 M105 120 C130 160 170 190 195 240" stroke="%23ffffff" stroke-width="3" fill="none"/>
    <!-- Severe underexposure / scatter noise -->
    <rect x="50" y="270" width="300" height="70" fill="%23ffffff" opacity="0.3" filter="blur(15px)"/>
    <text x="20" y="380" fill="%23ef4444" font-family="monospace" font-size="12">PORTABLE ICU BED AP - HIGH MAHALANOBIS OOD (2.14)</text>
  </svg>`
};

// 3 Pre-configured Demo Cases matching Section 26
export const DEMO_CASES: Record<string, AnalysisResult> = {
  'XR-2026-001': {
    id: 'XR-2026-001',
    timestamp: '2026-09-16 14:22:10 UTC',
    patientId: 'PT-884192',
    patientAge: 58,
    patientSex: 'M',
    viewPosition: 'PA',
    hospitalSource: 'Hospital A (Metropolitan Academic Center)',
    imageUri: SAMPLE_IMAGES.pneumonia,
    decision: 'ACCEPT',
    decisionHeadline: 'Prediction considered sufficiently reliable',
    decisionDescription: 'Calibrated confidence exceeds clinical threshold with minimal epistemic uncertainty and verified in-distribution feature geometry.',
    clinicalAction: 'Eligible for automated pre-reporting and prioritized clinical queue.',
    primaryPrediction: 'Pneumonia',
    primaryProbability: 0.942,
    predictions: [
      { label: 'Pneumonia', probability: 0.942, ciLower: 0.914, ciUpper: 0.965 },
      { label: 'No Finding', probability: 0.041, ciLower: 0.024, ciUpper: 0.062 },
      { label: 'Pleural Effusion', probability: 0.012, ciLower: 0.005, ciUpper: 0.021 },
      { label: 'Cardiomegaly', probability: 0.005, ciLower: 0.001, ciUpper: 0.011 }
    ],
    temperature: 1.18,
    calibrated: true,
    uncertainty: {
      epistemicUncertainty: 0.18,
      predictiveEntropy: 0.24,
      mcDropoutVariance: 0.07,
      aleatoricEntropy: 0.06,
      samplesCount: 25,
      level: 'Low'
    },
    ood: {
      mahalanobisDistance: 0.82,
      oodThreshold: 1.50,
      status: 'In-Distribution',
      isOOD: false,
      featureNorm: 14.8
    },
    decisionFactors: [
      {
        factor: 'Calibrated Confidence',
        status: 'pass',
        description: 'Primary prediction (94.2%) is well above the clinical decision threshold (85.0%).'
      },
      {
        factor: 'Epistemic Uncertainty',
        status: 'pass',
        description: 'Mutual information across 25 MC-Dropout passes is 0.18 (acceptable threshold < 0.35).'
      },
      {
        factor: 'Distributional Familiarity',
        status: 'pass',
        description: 'Mahalanobis feature distance is 0.82, safely within the training distribution (limit 1.50).'
      }
    ],
    isDemo: true,
    processingTimeMs: 1420
  },

  'XR-2026-002': {
    id: 'XR-2026-002',
    timestamp: '2026-09-16 14:35:45 UTC',
    patientId: 'PT-319042',
    patientAge: 42,
    patientSex: 'F',
    viewPosition: 'PA',
    hospitalSource: 'Hospital A (Metropolitan Academic Center)',
    imageUri: SAMPLE_IMAGES.normal,
    decision: 'UNCERTAIN',
    decisionHeadline: 'Prediction requires additional clinical review',
    decisionDescription: 'Model exhibits elevated epistemic uncertainty due to ambiguous subtle lung markings and borderline posterior distribution.',
    clinicalAction: 'Flagged for mandatory secondary radiologist review before issuing report.',
    primaryPrediction: 'No Finding',
    primaryProbability: 0.714,
    predictions: [
      { label: 'No Finding', probability: 0.714, ciLower: 0.621, ciUpper: 0.798 },
      { label: 'Pneumonia', probability: 0.218, ciLower: 0.142, ciUpper: 0.305 },
      { label: 'Infiltration', probability: 0.048, ciLower: 0.021, ciUpper: 0.082 },
      { label: 'Atelectasis', probability: 0.020, ciLower: 0.008, ciUpper: 0.042 }
    ],
    temperature: 1.18,
    calibrated: true,
    uncertainty: {
      epistemicUncertainty: 0.48,
      predictiveEntropy: 0.78,
      mcDropoutVariance: 0.28,
      aleatoricEntropy: 0.30,
      samplesCount: 25,
      level: 'Moderate'
    },
    ood: {
      mahalanobisDistance: 1.22,
      oodThreshold: 1.50,
      status: 'Borderline Shift',
      isOOD: false,
      featureNorm: 18.2
    },
    decisionFactors: [
      {
        factor: 'Calibrated Confidence',
        status: 'warning',
        description: 'Calibrated confidence (71.4%) falls below the 85.0% certainty threshold.'
      },
      {
        factor: 'Epistemic Uncertainty',
        status: 'warning',
        description: 'Elevated epistemic uncertainty (0.48) indicates disagreement across network parameter realizations.'
      },
      {
        factor: 'Distributional Familiarity',
        status: 'pass',
        description: 'Mahalanobis distance (1.22) is within distribution bounds, though near the borderline zone.'
      }
    ],
    isDemo: true,
    processingTimeMs: 1580
  },

  'XR-2026-003': {
    id: 'XR-2026-003',
    timestamp: '2026-09-16 15:02:18 UTC',
    patientId: 'PT-992011',
    patientAge: 67,
    patientSex: 'M',
    viewPosition: 'AP',
    hospitalSource: 'Hospital C (Regional Critical Care Bedside)',
    imageUri: SAMPLE_IMAGES.oodShift,
    decision: 'ABSTAIN',
    decisionHeadline: 'AI has abstained from making a reliable prediction',
    decisionDescription: 'Severe distribution shift detected. Foreign medical hardware (dual-chamber pacemaker) and portable bedside AP exposure differ substantially from training manifold.',
    clinicalAction: 'Prediction withheld. Mandatory full manual radiologist interpretation required.',
    primaryPrediction: 'Pneumonia (Uncalibrated Raw Logit)',
    primaryProbability: 0.881,
    predictions: [
      { label: 'Pneumonia (Unreliable)', probability: 0.881, ciLower: 0.612, ciUpper: 0.942 },
      { label: 'Atelectasis (Unreliable)', probability: 0.082, ciLower: 0.031, ciUpper: 0.174 },
      { label: 'Cardiomegaly (Unreliable)', probability: 0.024, ciLower: 0.009, ciUpper: 0.068 },
      { label: 'No Finding (Unreliable)', probability: 0.013, ciLower: 0.002, ciUpper: 0.045 }
    ],
    temperature: 1.18,
    calibrated: true,
    uncertainty: {
      epistemicUncertainty: 0.89,
      predictiveEntropy: 1.14,
      mcDropoutVariance: 0.62,
      aleatoricEntropy: 0.25,
      samplesCount: 25,
      level: 'High'
    },
    ood: {
      mahalanobisDistance: 2.14,
      oodThreshold: 1.50,
      status: 'Potential Out-of-Distribution Case',
      isOOD: true,
      featureNorm: 31.4
    },
    decisionFactors: [
      {
        factor: 'Distributional Familiarity',
        status: 'fail',
        description: 'Mahalanobis distance of 2.14 severely exceeds the 1.50 threshold. Scan contains hardware and acquisition shifts unseen in training.'
      },
      {
        factor: 'Epistemic Uncertainty',
        status: 'fail',
        description: 'Extreme epistemic variance (0.89) proves model lack of clinical knowledge on this shifted presentation.'
      },
      {
        factor: 'False Confidence Prevention',
        status: 'warning',
        description: 'Conventional AI would have reported 88.1% Pneumonia. ClinSure successfully blocked this dangerous overconfident prediction.'
      }
    ],
    isDemo: true,
    processingTimeMs: 1640
  }
};

// Analysis History table records
export const MOCK_HISTORY: AnalysisHistoryItem[] = [
  {
    id: 'XR-2026-001',
    timestamp: '2026-09-16 14:22:10',
    patientId: 'PT-884192',
    prediction: 'Pneumonia',
    confidence: 0.942,
    epistemicUncertainty: 0.18,
    uncertaintyLevel: 'Low',
    oodScore: 0.82,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-002',
    timestamp: '2026-09-16 14:35:45',
    patientId: 'PT-319042',
    prediction: 'No Finding',
    confidence: 0.714,
    epistemicUncertainty: 0.48,
    uncertaintyLevel: 'Moderate',
    oodScore: 1.22,
    decision: 'UNCERTAIN',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-003',
    timestamp: '2026-09-16 15:02:18',
    patientId: 'PT-992011',
    prediction: 'Pneumonia',
    confidence: 0.881,
    epistemicUncertainty: 0.89,
    uncertaintyLevel: 'High',
    oodScore: 2.14,
    decision: 'ABSTAIN',
    hospitalSource: 'Hospital C'
  },
  {
    id: 'XR-2026-004',
    timestamp: '2026-09-16 13:10:05',
    patientId: 'PT-104921',
    prediction: 'No Finding',
    confidence: 0.968,
    epistemicUncertainty: 0.11,
    uncertaintyLevel: 'Low',
    oodScore: 0.65,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-005',
    timestamp: '2026-09-16 12:44:30',
    patientId: 'PT-773190',
    prediction: 'Cardiomegaly',
    confidence: 0.912,
    epistemicUncertainty: 0.22,
    uncertaintyLevel: 'Low',
    oodScore: 0.95,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital B'
  },
  {
    id: 'XR-2026-006',
    timestamp: '2026-09-16 11:58:12',
    patientId: 'PT-552104',
    prediction: 'Pleural Effusion',
    confidence: 0.685,
    epistemicUncertainty: 0.52,
    uncertaintyLevel: 'Moderate',
    oodScore: 1.35,
    decision: 'UNCERTAIN',
    hospitalSource: 'Hospital B'
  },
  {
    id: 'XR-2026-007',
    timestamp: '2026-09-16 11:15:40',
    patientId: 'PT-883019',
    prediction: 'Pneumothorax',
    confidence: 0.842,
    epistemicUncertainty: 0.74,
    uncertaintyLevel: 'High',
    oodScore: 1.98,
    decision: 'ABSTAIN',
    hospitalSource: 'Hospital D'
  },
  {
    id: 'XR-2026-008',
    timestamp: '2026-09-16 10:20:00',
    patientId: 'PT-441209',
    prediction: 'No Finding',
    confidence: 0.951,
    epistemicUncertainty: 0.14,
    uncertaintyLevel: 'Low',
    oodScore: 0.71,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-009',
    timestamp: '2026-09-16 09:40:22',
    patientId: 'PT-660193',
    prediction: 'Pneumonia',
    confidence: 0.760,
    epistemicUncertainty: 0.44,
    uncertaintyLevel: 'Moderate',
    oodScore: 1.18,
    decision: 'UNCERTAIN',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-010',
    timestamp: '2026-09-16 08:55:10',
    patientId: 'PT-229103',
    prediction: 'Cardiomegaly',
    confidence: 0.893,
    epistemicUncertainty: 0.82,
    uncertaintyLevel: 'High',
    oodScore: 2.30,
    decision: 'ABSTAIN',
    hospitalSource: 'Hospital C'
  },
  {
    id: 'XR-2026-011',
    timestamp: '2026-09-15 17:30:15',
    patientId: 'PT-338291',
    prediction: 'No Finding',
    confidence: 0.978,
    epistemicUncertainty: 0.09,
    uncertaintyLevel: 'Low',
    oodScore: 0.58,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital A'
  },
  {
    id: 'XR-2026-012',
    timestamp: '2026-09-15 16:15:44',
    patientId: 'PT-112094',
    prediction: 'Pneumonia',
    confidence: 0.925,
    epistemicUncertainty: 0.19,
    uncertaintyLevel: 'Low',
    oodScore: 0.88,
    decision: 'ACCEPT',
    hospitalSource: 'Hospital B'
  }
];

// Dashboard aggregate statistics
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalAnalyses: 1482,
  accepted: 1128,
  uncertain: 241,
  abstained: 113,
  averageConfidence: 0.894,
  oodCases: 94,
  decisionDistribution: [
    { name: 'Accepted', value: 1128, color: '#10b981' },
    { name: 'Uncertain', value: 241, color: '#f59e0b' },
    { name: 'Abstained', value: 113, color: '#ef4444' }
  ],
  confidenceVsUncertainty: [
    { id: '1', confidence: 0.96, uncertainty: 0.08, decision: 'ACCEPT', prediction: 'No Finding' },
    { id: '2', confidence: 0.94, uncertainty: 0.14, decision: 'ACCEPT', prediction: 'Pneumonia' },
    { id: '3', confidence: 0.91, uncertainty: 0.18, decision: 'ACCEPT', prediction: 'Cardiomegaly' },
    { id: '4', confidence: 0.88, uncertainty: 0.22, decision: 'ACCEPT', prediction: 'Effusion' },
    { id: '5', confidence: 0.85, uncertainty: 0.25, decision: 'ACCEPT', prediction: 'Pneumonia' },
    { id: '6', confidence: 0.78, uncertainty: 0.42, decision: 'UNCERTAIN', prediction: 'Pneumonia' },
    { id: '7', confidence: 0.74, uncertainty: 0.49, decision: 'UNCERTAIN', prediction: 'No Finding' },
    { id: '8', confidence: 0.71, uncertainty: 0.53, decision: 'UNCERTAIN', prediction: 'Infiltration' },
    { id: '9', confidence: 0.68, uncertainty: 0.58, decision: 'UNCERTAIN', prediction: 'Atelectasis' },
    { id: '10', confidence: 0.63, uncertainty: 0.66, decision: 'UNCERTAIN', prediction: 'Cardiomegaly' },
    { id: '11', confidence: 0.89, uncertainty: 0.84, decision: 'ABSTAIN', prediction: 'Pneumonia (OOD)' },
    { id: '12', confidence: 0.84, uncertainty: 0.88, decision: 'ABSTAIN', prediction: 'Hardware Artifact' },
    { id: '13', confidence: 0.79, uncertainty: 0.92, decision: 'ABSTAIN', prediction: 'Foreign Body' },
    { id: '14', confidence: 0.72, uncertainty: 0.95, decision: 'ABSTAIN', prediction: 'Bedside Motion Blur' },
    { id: '15', confidence: 0.65, uncertainty: 0.98, decision: 'ABSTAIN', prediction: 'Pediatric Shift' },
  ],
  recentAnalyses: MOCK_HISTORY
};

// Model Analytics research metrics
export const MOCK_MODEL_METRICS: ModelMetrics = {
  accuracy: 0.924,
  precision: 0.918,
  recall: 0.907,
  f1Score: 0.912,
  auroc: 0.948,
  ece: 0.024,
  calibrationData: [
    { confidenceBin: '0.0 - 0.1', predictedConfidence: 0.05, observedAccuracy: 0.04, count: 42, perfectCalibration: 0.05 },
    { confidenceBin: '0.1 - 0.2', predictedConfidence: 0.15, observedAccuracy: 0.14, count: 68, perfectCalibration: 0.15 },
    { confidenceBin: '0.2 - 0.3', predictedConfidence: 0.25, observedAccuracy: 0.24, count: 85, perfectCalibration: 0.25 },
    { confidenceBin: '0.3 - 0.4', predictedConfidence: 0.35, observedAccuracy: 0.33, count: 112, perfectCalibration: 0.35 },
    { confidenceBin: '0.4 - 0.5', predictedConfidence: 0.45, observedAccuracy: 0.46, count: 140, perfectCalibration: 0.45 },
    { confidenceBin: '0.5 - 0.6', predictedConfidence: 0.55, observedAccuracy: 0.54, count: 210, perfectCalibration: 0.55 },
    { confidenceBin: '0.6 - 0.7', predictedConfidence: 0.65, observedAccuracy: 0.63, count: 320, perfectCalibration: 0.65 },
    { confidenceBin: '0.7 - 0.8', predictedConfidence: 0.75, observedAccuracy: 0.76, count: 540, perfectCalibration: 0.75 },
    { confidenceBin: '0.8 - 0.9', predictedConfidence: 0.85, observedAccuracy: 0.86, count: 980, perfectCalibration: 0.85 },
    { confidenceBin: '0.9 - 1.0', predictedConfidence: 0.95, observedAccuracy: 0.94, count: 1450, perfectCalibration: 0.95 }
  ],
  confidenceDistribution: [
    { bin: '< 50%', count: 82 },
    { bin: '50-60%', count: 145 },
    { bin: '60-70%', count: 234 },
    { bin: '70-80%', count: 412 },
    { bin: '80-90%', count: 890 },
    { bin: '90-100%', count: 1680 }
  ],
  uncertaintyDistribution: [
    { bin: '0.0 - 0.1 (Very Low)', count: 1240 },
    { bin: '0.1 - 0.2 (Low)', count: 950 },
    { bin: '0.2 - 0.3 (Borderline)', count: 510 },
    { bin: '0.3 - 0.5 (Moderate)', count: 320 },
    { bin: '0.5 - 0.7 (Elevated)', count: 180 },
    { bin: '> 0.7 (Severe)', count: 110 }
  ],
  decisionBreakdown: [
    { label: 'ACCEPT (Automated Triage)', count: 1128, percentage: 76.1, color: '#10b981' },
    { label: 'UNCERTAIN (Secondary Review)', count: 241, percentage: 16.3, color: '#f59e0b' },
    { label: 'ABSTAIN (Clinical Escalation)', count: 113, percentage: 7.6, color: '#ef4444' }
  ]
};

// Robustness under distribution shift across hospitals
export const MOCK_ROBUSTNESS_METRICS: RobustnessMetrics = {
  hospitals: [
    {
      name: 'Hospital A (Academic Medical Center)',
      code: 'HOSP-A-ID',
      deviceType: 'Siemens Ysio Max (Fixed PA Detector)',
      sampleSize: 3200,
      accuracy: 0.938,
      auroc: 0.956,
      ece: 0.021,
      avgUncertainty: 0.14,
      oodDetectionRate: 0.02,
      abstentionRate: 0.04,
      isShifted: false,
      shiftType: 'In-Distribution (Baseline)',
      description: 'Standard upright PA acquisitions matching model training distribution. High signal-to-noise ratio.'
    },
    {
      name: 'Hospital B (Suburban Community Hospital)',
      code: 'HOSP-B-COV',
      deviceType: 'GE Healthcare Definium 646',
      sampleSize: 1850,
      accuracy: 0.912,
      auroc: 0.932,
      ece: 0.038,
      avgUncertainty: 0.26,
      oodDetectionRate: 0.08,
      abstentionRate: 0.11,
      isShifted: true,
      shiftType: 'Acquisition & Contrast Drift',
      description: 'Different beam energy (kVp), detector pixel pitch, and post-processing algorithms. Mild domain shift.'
    },
    {
      name: 'Hospital C (Metro Critical Care & Trauma ICU)',
      code: 'HOSP-C-BED',
      deviceType: 'Philips MobileDiagnost wDR (Portable AP)',
      sampleSize: 1420,
      accuracy: 0.865,
      auroc: 0.884,
      ece: 0.072,
      avgUncertainty: 0.54,
      oodDetectionRate: 0.38,
      abstentionRate: 0.42,
      isShifted: true,
      shiftType: 'Bedside AP & Hardware Artifacts',
      description: 'Supine bedside portable radiographs with endotracheal tubes, central lines, pacemakers, and motion artifacts.'
    },
    {
      name: 'Hospital D (Pediatric & Ambulatory Center)',
      code: 'HOSP-D-DEM',
      deviceType: 'Fujifilm FDR AQRO (Specialized)',
      sampleSize: 960,
      accuracy: 0.791,
      auroc: 0.821,
      ece: 0.108,
      avgUncertainty: 0.78,
      oodDetectionRate: 0.74,
      abstentionRate: 0.78,
      isShifted: true,
      shiftType: 'Demographic & Anatomical Shift',
      description: 'Pediatric age group and severe anatomical variations outside the adult training cohort.'
    }
  ],
  uncertaintyByShift: [
    { shiftLevel: 'In-Distribution (PA)', inDistribution: 0.14, acquisitionShift: 0.18, artifactShift: 0.22, farOod: 0.31 },
    { shiftLevel: 'Mild Noise / Contrast', inDistribution: 0.19, acquisitionShift: 0.27, artifactShift: 0.35, farOod: 0.48 },
    { shiftLevel: 'Portable AP Geometry', inDistribution: 0.24, acquisitionShift: 0.39, artifactShift: 0.54, farOod: 0.69 },
    { shiftLevel: 'Foreign Lines / Tubes', inDistribution: 0.28, acquisitionShift: 0.46, artifactShift: 0.68, farOod: 0.84 },
    { shiftLevel: 'Far-OOD / Non-Standard', inDistribution: 0.32, acquisitionShift: 0.52, artifactShift: 0.79, farOod: 0.96 }
  ],
  abstentionComparison: [
    { cohort: 'Hospital A (ID Baseline)', accept: 88.5, uncertain: 8.5, abstain: 3.0 },
    { cohort: 'Hospital B (Acquisition Shift)', accept: 79.2, uncertain: 13.8, abstain: 7.0 },
    { cohort: 'Hospital C (ICU Bedside Shift)', accept: 46.5, uncertain: 28.5, abstain: 25.0 },
    { cohort: 'Hospital D (Demographic Shift)', accept: 18.2, uncertain: 34.8, abstain: 47.0 },
  ]
};
