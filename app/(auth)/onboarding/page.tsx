'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
                <BarChart3 className="h-5 w-5 text-white dark:text-gray-900" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">FinanceApp</span>
            </div>

            <h1 className="mt-6 text-3xl font-semibold text-gray-900 dark:text-white">
              Welcome aboard
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You’re signed in. Let’s set up the essentials so you can start invoicing.
            </p>

            <div className="mt-6 space-y-4">
              {[
                'Create your business profile',
                'Add your first client',
                'Send your first invoice',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/business"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900"
              >
                Set up business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                Go to dashboard
              </Link>
            </div>
          </div>

          <div className="relative p-8 sm:p-10 bg-gray-900 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative z-10 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-white/80">
                Your business profile powers branded invoices, tax compliance, and WhatsApp receipts.
              </p>
              <p className="text-xs text-white/50">
                You can update this anytime from the Business page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
