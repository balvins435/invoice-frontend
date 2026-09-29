'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Spinner } from '@/components/ui/Spinner';
import { authService } from '@/lib/auth';
import { ROUTES, sanitizeNextRoute } from '@/lib/routes';

type GuardMode = 'protected' | 'guest';

interface RouteGuardProps {
  mode: GuardMode;
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ mode, children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [canRender, setCanRender] = useState(false);

  // Deliberately not keyed on the pathname. Layouts persist across navigations, so
  // listing it re-ran the auth check - and its /me/ request - on every page click.
  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      const isAuthenticated = await authService.checkAuth();
      if (!isMounted) return;

      if (mode === 'protected' && !isAuthenticated) {
        const target = sanitizeNextRoute(
          `${window.location.pathname}${window.location.search}`,
          ROUTES.dashboard
        );
        router.replace(`${ROUTES.login}?next=${encodeURIComponent(target)}`);
        setCanRender(false);
        setIsLoading(false);
        return;
      }

      if (mode === 'guest' && isAuthenticated) {
        router.replace(ROUTES.dashboard);
        setCanRender(false);
        setIsLoading(false);
        return;
      }

      setCanRender(true);
      setIsLoading(false);
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, [mode, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Spinner size={28} />
      </div>
    );
  }

  if (!canRender) return null;
  return <>{children}</>;
};
