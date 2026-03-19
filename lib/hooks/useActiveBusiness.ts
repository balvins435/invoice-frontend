import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService } from '@/lib/api';
import { Business } from '@/types';

const ACTIVE_BUSINESS_STORAGE_KEY = 'smartinvoice.activeBusinessId';
const ACTIVE_BUSINESS_CHANGE_EVENT = 'smartinvoice:active-business-changed';

const parseList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === 'object' &&
    'results' in payload &&
    Array.isArray((payload as { results?: unknown }).results)
  ) {
    return (payload as { results: T[] }).results;
  }
  return [];
};

const readStoredActiveBusinessId = (): number | null => {
  if (typeof window === 'undefined') return null;

  const value = window.sessionStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const persistActiveBusinessId = (businessId: number | null, broadcast = true) => {
  if (typeof window === 'undefined') return;

  if (businessId === null) {
    window.sessionStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
  } else {
    window.sessionStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, String(businessId));
  }

  if (broadcast) {
    window.dispatchEvent(
      new CustomEvent(ACTIVE_BUSINESS_CHANGE_EVENT, {
        detail: { businessId },
      })
    );
  }
};

const resolveActiveBusinessId = (
  businesses: Business[],
  preferredBusinessId: number | null
): number | null => {
  if (!businesses.length) return null;

  if (preferredBusinessId && businesses.some((business) => business.id === preferredBusinessId)) {
    return preferredBusinessId;
  }

  if (businesses.length === 1) {
    return businesses[0].id;
  }

  return null;
};

export const getStoredActiveBusinessId = () => readStoredActiveBusinessId();

export const setStoredActiveBusinessId = (businessId: number | null) => {
  persistActiveBusinessId(businessId);
};

export const useActiveBusiness = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const syncWithStorage = useCallback((nextBusinesses: Business[]) => {
    const resolvedBusinessId = resolveActiveBusinessId(nextBusinesses, readStoredActiveBusinessId());
    setActiveBusinessIdState(resolvedBusinessId);
    persistActiveBusinessId(resolvedBusinessId, false);
  }, []);

  const refreshBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.business.getAll();
      const nextBusinesses = parseList<Business>(response.data);
      setBusinesses(nextBusinesses);
      syncWithStorage(nextBusinesses);
    } catch (err) {
      setBusinesses([]);
      setActiveBusinessIdState(null);
      persistActiveBusinessId(null, false);
      setError(err instanceof Error ? err : new Error('Failed to load businesses'));
    } finally {
      setIsLoading(false);
    }
  }, [syncWithStorage]);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBusinessChange = () => {
      setActiveBusinessIdState(resolveActiveBusinessId(businesses, readStoredActiveBusinessId()));
    };

    window.addEventListener(ACTIVE_BUSINESS_CHANGE_EVENT, handleBusinessChange);
    window.addEventListener('storage', handleBusinessChange);

    return () => {
      window.removeEventListener(ACTIVE_BUSINESS_CHANGE_EVENT, handleBusinessChange);
      window.removeEventListener('storage', handleBusinessChange);
    };
  }, [businesses]);

  const setActiveBusinessId = useCallback(
    (businessId: number | null) => {
      const nextBusinessId =
        businessId && businesses.some((business) => business.id === businessId)
          ? businessId
          : null;

      setActiveBusinessIdState(nextBusinessId);
      persistActiveBusinessId(nextBusinessId);
    },
    [businesses]
  );

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) || null,
    [activeBusinessId, businesses]
  );

  return {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    isLoading,
    error,
    hasBusinesses: businesses.length > 0,
    requiresSelection: businesses.length > 1 && activeBusinessId === null,
    refreshBusinesses,
  };
};
