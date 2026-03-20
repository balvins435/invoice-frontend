'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

const schema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.new_password === data.confirm_password, {
  path: ['confirm_password'],
  message: 'Passwords do not match',
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const uid = searchParams?.get('uid') ?? '';
  const token = searchParams?.get('token') ?? '';
  const isLinkValid = useMemo(() => uid.length > 0 && token.length > 0, [uid, token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onSubmit = async (data: FormData) => {
    if (!isLinkValid) {
      toast.error('Invalid or expired reset link.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await authService.confirmPasswordReset(
        uid,
        token,
        data.new_password,
        data.confirm_password
      );
      if (result.success) {
        toast.success(result.message || 'Password reset successfully.');
        setTimeout(() => router.push(ROUTES.login), 600);
      } else {
        toast.error(result.error || 'Failed to reset password.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gray-900 dark:bg-gray-900 p-12 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">FinanceApp</span>
          </div>
        </div>
        <div className="relative z-10 my-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Secure reset
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Set a new password<br />
            <span className="text-gray-400">and keep going.</span>
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
            Choose a strong password to keep your account protected.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} FinanceApp · Secure access recovery
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
            <BarChart3 className="h-5 w-5 text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            FinanceApp
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Reset your password
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {!isLinkValid && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              This reset link is invalid or expired. Please request a new one.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.new_password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              showPasswordToggle
              {...register('new_password')}
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              showPasswordToggle
              {...register('confirm_password')}
            />

            <button
              type="submit"
              disabled={isLoading || !isLinkValid}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 shadow-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                <>
                  Reset password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={ROUTES.forgotPassword}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    )}>
      <ResetPasswordForm />
    </Suspense>
  );
}
