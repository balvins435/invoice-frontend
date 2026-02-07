'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  BarChart3, 
  CreditCard, 
  FileText, 
  Shield,
  Smartphone,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const features = [
    {
      icon: FileText,
      title: 'Smart Invoicing',
      description: 'Create, send, and track professional invoices in minutes.',
    },
    {
      icon: CreditCard,
      title: 'Expense Tracking',
      description: 'Monitor business expenses and categorize them for tax purposes.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Reports',
      description: 'Get instant insights into your business performance and profitability.',
    },
    {
      icon: Shield,
      title: 'Tax Ready',
      description: 'Automatically calculate VAT and prepare tax summaries.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Manage your business on the go with our responsive design.',
    },
    {
      icon: Zap,
      title: 'Fast & Simple',
      description: 'Designed for African SMEs - no complicated setup required.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-600">InvoiceTracker</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
            <Link href="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Smart Invoice & Expense
          <span className="text-primary-600"> Tracker</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Designed for African SMEs and freelancers. Manage invoices, track expenses, 
          and get tax-ready reports in one simple platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage Your Business
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Built specifically for the unique needs of African small businesses 
            and freelancers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Streamline Your Business?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of African entrepreneurs who trust InvoiceTracker 
            for their business management.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Get Started Free for 14 Days
            </Button>
          </Link>
          <p className="text-primary-200 mt-4 text-sm">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">InvoiceTracker</span>
              </div>
              <p className="text-sm">Smart business management for Africa.</p>
            </div>
            <div className="text-sm">
              <p>© {new Date().getFullYear()} InvoiceTracker. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}