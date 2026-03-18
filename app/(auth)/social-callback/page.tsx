'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import api, { setAuthTokens } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/lib/routes';
import { session } from '@/lib/session';

const SocialCallbackInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    return {
      access: searchParams.get('access'),
      refresh: searchParams.get('refresh'),
      provider: searchParams.get('provider'),
      isNew: searchParams.get('is_new'),
      error: searchParams.get('error'),
    };
  }, [searchParams]);

  useEffect(() => {
    const run = async () => {
      if (params.error) {
        setError(params.error);
        return;
      }

      if (!params.access || !params.refresh) {
        setError('Missing authentication tokens.');
        return;
      }

      setAuthTokens({ access: params.access, refresh: params.refresh });
      api.defaults.headers.common['Authorization'] = `Bearer ${params.access}`;

      try {
        const userResponse = await api.get('/me/');
        session.setRawUser(JSON.stringify(userResponse.data));
        if (params.isNew === '1') {
          router.replace(ROUTES.onboarding);
        } else {
          router.replace(ROUTES.dashboard);
        }
      } catch {
        setError('Failed to load your profile. Please try again.');
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        {error ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Social sign-in failed</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {error}
              </p>
              <button
                type="button"
                onClick={() => router.replace(ROUTES.login)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900"
              >
                Back to login
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Spinner size={20} className="text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Completing {params.provider ? `${params.provider} ` : ''}sign-in…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SocialCallbackPage() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-6">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
            </div>
          </div>
        </div>
      )}
    >
      <SocialCallbackInner />
    </Suspense>
  );
}
