'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, CreditCard, FileText, Shield,
  Smartphone, Zap, Mail, Check, Sparkles,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: FileText,
    title: 'Smart Invoicing',
    description: 'Create, send, and track professional invoices in minutes.',
    color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  },
  {
    icon: CreditCard,
    title: 'Expense Tracking',
    description: 'Monitor business expenses and categorize them for tax purposes.',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Real-time Reports',
    description: 'Get instant insights into your business performance and profitability.',
    color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
  },
  {
    icon: Shield,
    title: 'Tax Ready',
    description: 'Automatically calculate VAT and prepare tax summaries.',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Manage your business on the go with our responsive design.',
    color: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400',
  },
  {
    icon: Zap,
    title: 'Fast & Simple',
    description: 'Designed for African SMEs — no complicated setup required.',
    color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400',
  },
];

const benefits = [
  'No credit card required to start',
  '14-day free trial for all features',
  'Cancel anytime, no hidden fees',
  'Built specifically for African businesses',
  'Customer support via email & WhatsApp',
  'Regular updates and improvements',
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
                <FileText className="h-5 w-5 text-white dark:text-gray-900" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-gray-900 dark:text-white">InvoiceTracker</span>
                <p className="text-xs text-gray-400 dark:text-gray-500">Smart Business Management</p>
              </div>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20 dark:opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Built for African SMEs</span>
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Smart Invoice &{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                Expense Tracker
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:text-lg lg:text-xl">
              Designed specifically for African SMEs and freelancers. Manage invoices, track expenses, and get tax-ready reports in one simple platform.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-6 py-3 text-base font-semibold text-white dark:text-gray-900 shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-[0.98] sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors sm:w-auto"
              >
                Learn More
              </a>
            </div>

            {/* Trust indicators */}
            <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ── Features section ── */}
      <section id="features" className="relative bg-gray-50/60 dark:bg-gray-900/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything You Need to Manage Your Business
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:text-lg">
              Built specifically for the unique needs of African small businesses and freelancers.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${color} mb-5`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits section ── */}
      <section className="relative overflow-hidden bg-gray-900 dark:bg-gray-950 py-20 sm:py-28">
        {/* Background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Why Choose InvoiceTracker?
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-base text-gray-100">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="bg-white dark:bg-gray-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 p-8 sm:p-12 lg:p-16 text-center shadow-2xl">
            {/* Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)' }}
            />

            <div className="relative">
              <h2 className="text-3xl font-bold text-white dark:text-gray-900 sm:text-4xl">
                Ready to Streamline Your Business?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 dark:text-gray-600 sm:text-lg">
                Join thousands of African entrepreneurs who trust InvoiceTracker for their business management. Start your 14-day free trial today.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-6 py-3 text-base font-semibold text-gray-900 dark:text-white shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all sm:w-auto"
                >
                  Get Started Free for 14 Days
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 dark:border-gray-900/30 bg-white/10 dark:bg-gray-900/10 px-6 py-3 text-base font-medium text-white dark:text-gray-900 hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors sm:w-auto"
                >
                  Book a Demo
                </Link>
              </div>

              <p className="mt-6 text-sm text-gray-400 dark:text-gray-600">
                No credit card required · Cancel anytime · 24/7 Support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            {/* Left — Logo + Links */}
            <div className="text-center sm:text-left">
              <div className="mb-4 flex items-center justify-center gap-3 sm:justify-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
                  <FileText className="h-5 w-5 text-white dark:text-gray-900" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">InvoiceTracker</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Smart business management for Africa</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Contact', href: '/contact' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right — Contact + Copyright */}
            <div className="text-center sm:text-right">
              <div className="mb-2 flex items-center justify-center gap-2 sm:justify-end">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">support@invoicetracker.co.ke</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                © {new Date().getFullYear()} InvoiceTracker. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}