import { useState, useEffect, useCallback } from 'react';
import { AnalysisHistoryItem } from '../types';
import { apiService } from '../services/api';

export function useAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAnalysisHistory();
      setHistory(data);
    } catch (err) {
      setError('Unable to retrieve analysis history records');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refreshHistory: fetchHistory,
  };
}
