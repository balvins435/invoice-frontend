'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail, Lock, User, Loader2, ArrowRight, BarChart3,
  Check, X, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { authService } from '@/lib/auth';

// ── Schema ───────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ── Password strength ────────────────────────────────────────────────────────
const getStrength = (pw: string) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const strengthMeta = [
  { label: 'Very weak',  bar: 'bg-red-500',    text: 'text-red-500 dark:text-red-400' },
  { label: 'Weak',       bar: 'bg-orange-500',  text: 'text-orange-500 dark:text-orange-400' },
  { label: 'Fair',       bar: 'bg-amber-500',   text: 'text-amber-500 dark:text-amber-400' },
  { label: 'Good',       bar: 'bg-blue-500',    text: 'text-blue-500 dark:text-blue-400' },
  { label: 'Strong',     bar: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400' },
  { label: 'Very strong',bar: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400' },
];

// ── Password rule row ─────────────────────────────────────────────────────────
const Rule = ({ met, label }: { met: boolean; label: string }) => (
  <li className={`flex items-center gap-1.5 transition-colors ${
    met ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
  }`}>
    {met
      ? <Check className="h-3 w-3 shrink-0" />
      : <X className="h-3 w-3 shrink-0 opacity-50" />
    }
    <span>{label}</span>
  </li>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', password: '', password_confirm: '',
    },
  });

  const password = watch('password') ?? '';
  const passwordConfirm = watch('password_confirm') ?? '';
  const strength = getStrength(password);
  const meta = strengthMeta[Math.min(strength, 5)];
  const passwordsMatch = password && passwordConfirm && password === passwordConfirm;
  const passwordsMismatch = password && passwordConfirm && password !== passwordConfirm;

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await authService.register(
        data.email, data.password, data.first_name, data.last_name
      );
      if (result.success) {
        toast.success('Account created! Welcome aboard.');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between bg-gray-900 dark:bg-gray-900 p-12 relative overflow-hidden">

        {/* Dot grid */}
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
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
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

        {/* Copy */}
        <div className="relative z-10 my-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Get started free
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Set up your account<br />
            <span className="text-gray-400">in under a minute.</span>
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
            Join businesses that use FinanceApp to manage invoices, track expenses, and stay on top of their finances.
          </p>

          {/* Trust indicators */}
          <div className="mt-10 space-y-4">
            {[
              'No credit card required',
              'Free 14-day trial on all plans',
              'Cancel or upgrade any time',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/10">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5">
            <ShieldCheck className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Your data is encrypted at rest and in transit. We never sell or share your financial information.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} FinanceApp · Built for modern businesses
          </p>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12 overflow-y-auto">

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
            <BarChart3 className="h-5 w-5 text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            FinanceApp
          </span>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              Already have one?{' '}
              <Link
                href="/login"
                className="font-semibold text-gray-900 dark:text-white hover:underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                error={errors.first_name?.message}
                leftIcon={<User className="h-4 w-4" />}
                placeholder="Jane"
                {...register('first_name')}
              />
              <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                error={errors.last_name?.message}
                leftIcon={<User className="h-4 w-4" />}
                placeholder="Doe"
                {...register('last_name')}
              />
            </div>

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
              {...register('email')}
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Create a password"
                showPasswordToggle
                {...register('password')}
              />

              {password && (
                <div className="mt-2.5 space-y-2.5">
                  {/* Strength bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            n <= strength ? meta.bar : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${meta.text}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Rules checklist */}
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <Rule met={password.length >= 8}          label="8+ characters" />
                    <Rule met={/[A-Z]/.test(password)}        label="Uppercase letter" />
                    <Rule met={/[a-z]/.test(password)}        label="Lowercase letter" />
                    <Rule met={/[0-9]/.test(password)}        label="Number" />
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                error={errors.password_confirm?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Repeat your password"
                showPasswordToggle
                {...register('password_confirm')}
              />

              {/* Match indicator */}
              {(passwordsMatch || passwordsMismatch) && (
                <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  passwordsMatch
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}>
                  {passwordsMatch
                    ? <><Check className="h-3.5 w-3.5" /> Passwords match</>
                    : <><X className="h-3.5 w-3.5" /> Passwords do not match</>
                  }
                </p>
              )}
            </div>

            {/* Terms checkbox */}
            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 accent-gray-900 dark:accent-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
              <span className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-gray-900 dark:text-white hover:underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-gray-900 dark:text-white hover:underline underline-offset-2">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-gray-900 shadow-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-950 px-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                or sign up with
              </span>
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Google', logo: 'G' },
              { label: 'Microsoft', logo: 'M' },
            ].map(({ label, logo }) => (
              <button
                key={label}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{logo}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} FinanceApp · Secure &amp; encrypted
          </p>
        </div>
      </div>
    </div>
  );
}