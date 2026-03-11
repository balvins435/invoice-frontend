'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, ArrowRight, BarChart3, FileText, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/auth';
import api from '@/lib/api';

type SocialProvider = {
  id: string;
  label: string;
  slug: string;
  login_url: string;
};

// ── Schema ──────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Feature highlights shown on the left panel ──────────────────────────────
const features = [
  {
    icon: FileText,
    title: 'Smart Invoicing',
    desc: 'Create, send, and track invoices in seconds',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    desc: 'Real-time insights into income, expenses, and tax',
  },
  {
    icon: Building2,
    title: 'Multi-Business',
    desc: 'Manage multiple businesses from one account',
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [redirectingProvider, setRedirectingProvider] = useState<SocialProvider | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await authService.login(data.email, data.password);
      if (result.success) {
        toast.success('Welcome back!', { duration: 2000 });
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        toast.error(result.error || 'Invalid credentials. Please try again.');
        setValue('password', '');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
// Handles social login by redirecting to the appropriate OAuth endpoint based on the selected provider.
  useEffect(() => {
    let mounted = true;
    const loadProviders = async () => {
      try {
        const response = await api.get('/social/providers/');
        const list = response.data?.providers ?? [];
        if (mounted) {
          setProviders(list);
        }
      } catch {
        if (mounted) {
          setProviders([]);
        }
      } finally {
        if (mounted) {
          setProvidersLoading(false);
        }
      }
    };

    loadProviders();
    return () => {
      mounted = false;
    };
  }, []);

  const socialButtons = useMemo(() => providers, [providers]);

  const handleSocialLogin = (provider: SocialProvider) => {
    if (typeof window === 'undefined') return;
    setRedirectingProvider(provider);
    window.location.href = provider.login_url;
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">

      {/* ── Left panel — brand / feature highlights ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gray-900 dark:bg-gray-900 p-12 relative overflow-hidden">

        {/* Subtle background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">FinanceApp</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 my-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Financial Management
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Run your finances<br />
            <span className="text-gray-400">with clarity.</span>
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
            Everything you need to invoice clients, track expenses, and understand your business — in one place.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 border border-white/10">
                  <Icon className="h-4 w-4 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} FinanceApp · Built for modern businesses
          </p>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">

        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
            <BarChart3 className="h-5 w-5 text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            FinanceApp
          </span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Sign in to continue to your account
            </p>
          </div>

          {/* Form */}
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

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="••••••••"
                {...register('password')}
              />
              <div className="mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 shadow-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-950 px-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            {providersLoading && (
              <>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 px-4 py-2.5 text-sm font-medium text-gray-400 dark:text-gray-500"
                >
                  Loading…
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 px-4 py-2.5 text-sm font-medium text-gray-400 dark:text-gray-500"
                >
                  Loading…
                </button>
              </>
            )}

            {!providersLoading && socialButtons.length === 0 && (
              <div className="col-span-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 px-4 py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                Social sign-in is not configured yet.
              </div>
            )}

            {!providersLoading && socialButtons.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSocialLogin(provider)}
                disabled={!!redirectingProvider}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {provider.label[0]}
                </span>
                {provider.label}
              </button>
            ))}
          </div>

          {redirectingProvider && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Continuing with {redirectingProvider.label}…
            </div>
          )}

          {/* Footer links */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/register"
                onClick={() => setIsSwitching(true)}
                className="inline-flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:underline underline-offset-2 transition-colors"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Switching…
                  </>
                ) : (
                  'Sign up free'
                )}
              </Link>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-400 underline underline-offset-2 transition-colors">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-400 underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
