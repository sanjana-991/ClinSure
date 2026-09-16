import { useState, useCallback } from 'react';
import { AnalysisResult, AnalysisStage } from '../types';
import { apiService } from '../services/api';

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStage, setCurrentStage] = useState<AnalysisStage>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (file: File | { name: string; type: string; dataUrl: string }, presetId?: string) => {
      setIsLoading(true);
      setError(null);
      setCurrentStage('preprocessing');
      setProgressPercent(5);

      try {
        const data = await apiService.analyzeXRay(file, presetId, (stage, percent) => {
          setCurrentStage(stage);
          setProgressPercent(percent);
        });

        setCurrentStage('complete');
        setProgressPercent(100);
        setResult(data);
        return data;
      } catch (err: unknown) {
        console.error('Analysis error:', err);
        setCurrentStage('error');
        const message = err instanceof Error ? err.message : 'Unable to complete chest radiograph analysis';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setCurrentStage('idle');
    setProgressPercent(0);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    currentStage,
    progressPercent,
    isLoading,
    error,
    runAnalysis,
    resetAnalysis,
  };
}
