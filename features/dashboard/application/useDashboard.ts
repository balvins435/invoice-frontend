'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { DashboardStats } from '@/types';
import { selectDashboardMetrics } from '../domain/dashboard';
import { dashboardRepository, DashboardRepository } from '../infrastructure/dashboardApi';

export const useDashboard = (repository: DashboardRepository = dashboardRepository) => {
  const business = useActiveBusiness();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (business.error) toast.error('Failed to load businesses');
  }, [business.error]);

  const refresh = useCallback(async () => {
    if (business.isLoading) return;
    if (!business.activeBusinessId) {
      setStats(null);
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      setStats(await repository.getStats(business.activeBusinessId));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoadingStats(false);
    }
  }, [business.activeBusinessId, business.isLoading, repository]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const metrics = useMemo(() => selectDashboardMetrics(stats), [stats]);

  return {
    ...business,
    stats,
    metrics,
    refresh,
    isInitialLoading:
      (business.isLoading || isLoadingStats) && !stats && !business.requiresSelection && !business.error,
  };
};
