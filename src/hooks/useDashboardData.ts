import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../types';
import { apiService } from '../services/api';

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Unable to load clinical dashboard analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats,
  };
}
