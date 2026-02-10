'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/StatCard';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading] = useState(false);

  const stats = [
    {
      title: 'Total Income',
      value: 0,
      change: 0,
      icon: DollarSign,
      color: 'green' as const,
      formatCurrency: true,
    },
    {
      title: 'Total Expenses',
      value: 0,
      change: 0,
      icon: CreditCard,
      color: 'red' as const,
      formatCurrency: true,
    },
    {
      title: 'Pending Invoices',
      value: 0,
      change: 0,
      icon: FileText,
      color: 'orange' as const,
    },
    {
      title: 'Active Clients',
      value: 0,
      change: 0,
      icon: Users,
      color: 'blue' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Create Invoice',
      icon: FileText,
      href: '/dashboard/invoices/create',
      color: 'blue',
    },
    {
      title: 'Add Expense',
      icon: CreditCard,
      href: '/dashboard/expenses/create',
      color: 'green',
    },
    {
      title: 'View Reports',
      icon: BarChart3,
      href: '/dashboard/reports',
      color: 'purple',
    },
    {
      title: 'Manage Business',
      icon: Users,
      href: '/dashboard/business',
      color: 'orange',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to InvoiceTracker! 🎉
              </h2>
              <p className="text-gray-600 mb-4 md:mb-0">
                Start managing your invoices and expenses efficiently. Here's a quick overview of your business.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/dashboard/invoices/create"
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Link>
              <Link 
                href="/dashboard/expenses/create"
                className="btn-secondary flex items-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            formatCurrency={stat.formatCurrency}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                green: 'bg-green-100 text-green-600 border-green-200',
                purple: 'bg-purple-100 text-purple-600 border-purple-200',
                orange: 'bg-orange-100 text-orange-600 border-orange-200',
              };
              
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`
                    ${colorClasses[action.color as keyof typeof colorClasses]}
                    border rounded-xl p-6 text-center hover:shadow-md transition-shadow
                  `}
                >
                  <div className="flex flex-col items-center">
                    <Icon className="h-8 w-8 mb-3" />
                    <span className="font-medium">{action.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <Link 
                href="/dashboard/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent invoices</p>
              <Link 
                href="/dashboard/invoices/create"
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Invoice
              </Link>
            </div>
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
              <Link 
                href="/dashboard/expenses"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent expenses</p>
              <Link 
                href="/dashboard/expenses/create"
                className="btn-primary mt-4 inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}