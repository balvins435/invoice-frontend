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
  Zap,
  Mail,
  CheckCircle
} from 'lucide-react';

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

  const benefits = [
    'No credit card required to start',
    '14-day free trial for all features',
    'Cancel anytime, no hidden fees',
    'Built specifically for African businesses',
    'Customer support via email & WhatsApp',
    'Regular updates and improvements',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-blue-600">InvoiceTracker</span>
              <p className="text-xs text-gray-500">Smart Business Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Smart Invoice &{' '}
            <span className="text-blue-600">Expense Tracker</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Designed specifically for African SMEs and freelancers. Manage invoices, 
            track expenses, and get tax-ready reports in one simple platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center font-medium text-lg shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="#features"
              className="bg-white text-gray-700 px-8 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors inline-flex items-center justify-center font-medium text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage Your Business
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
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
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Why Choose InvoiceTracker?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-200 mt-1 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Streamline Your Business?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of African entrepreneurs who trust InvoiceTracker 
            for their business management. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              Get Started Free for 14 Days
            </Link>
            <Link 
              href="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium text-lg"
            >
              Book a Demo
            </Link>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            No credit card required • Cancel anytime • 24/7 Support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">InvoiceTracker</span>
                  <p className="text-sm">Smart business management for Africa.</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="/contact" className="text-sm hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="mb-4">
                <Mail className="h-5 w-5 inline mr-2" />
                <span>support@invoicetracker.co.ke</span>
              </div>
              <p className="text-sm">© {new Date().getFullYear()} InvoiceTracker. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}