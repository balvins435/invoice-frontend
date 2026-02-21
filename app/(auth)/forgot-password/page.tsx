'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Loader2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await authService.requestPasswordReset(data.email);
      if (result.success) {
        toast.success(result.message || 'Reset link sent. Check your email.');
        setEmailSent(true);
      } else {
        toast.error(result.error || 'Failed to send reset email.');
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
            Password Recovery
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Get back into your account<br />
            <span className="text-gray-400">in a few minutes.</span>
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
            We’ll email you a secure link to reset your password.
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
              Forgot your password?
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we’ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
              {...register('email')}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 shadow-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {emailSent && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              If an account exists for that email, we’ve sent a reset link.
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
