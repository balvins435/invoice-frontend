'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/lib/api';
import { DashboardStats, Invoice, Expense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.reports.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar title="Dashboard" subtitle="Your business overview" />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Dashboard" subtitle="Your business overview" />
      
      <main className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={stats?.total_income || 0}
            change={12.5}
            icon={TrendingUp}
            color="success"
            formatCurrency
          />
          
          <StatCard
            title="Total Expenses"
            value={stats?.total_expenses || 0}
            change={-5.2}
            icon={TrendingDown}
            color="danger"
            formatCurrency
          />
          
          <StatCard
            title="Net Profit"
            value={stats?.net_profit || 0}
            change={8.3}
            icon={DollarSign}
            color="primary"
            formatCurrency
          />
          
          <StatCard
            title="Pending Invoices"
            value={stats?.pending_invoices || 0}
            icon={FileText}
            color="warning"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card title="Recent Invoices" actions={
            <Button variant="secondary" size="sm">
              View All
            </Button>
          }>
            <div className="space-y-4">
              {stats?.recent_invoices?.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.client_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.invoice_number} • {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-success-100 text-success-800'
                        : invoice.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!stats?.recent_invoices || stats.recent_invoices.length === 0) && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent invoices</p>
                  <Button className="mt-4">Create Your First Invoice</Button>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Expenses */}
          <Card title="Recent Expenses" actions={
            <Button variant="secondary" size="sm">
              View All
            </Button>
          }>
            <div className="space-y-4">
              {stats?.recent_expenses?.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{expense.title}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{expense.category}</span>
                      <span>•</span>
                      <span>{formatDate(expense.expense_date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    {expense.tax_deductible && (
                      <span className="inline-block px-2 py-1 text-xs bg-success-100 text-success-800 rounded-full">
                        Tax Deductible
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(!stats?.recent_expenses || stats.recent_expenses.length === 0) && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent expenses</p>
                  <Button className="mt-4">Add Your First Expense</Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button className="h-24 flex flex-col items-center justify-center">
                <FileText className="h-8 w-8 mb-2" />
                <span>Create Invoice</span>
              </Button>
              
              <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
                <CreditCard className="h-8 w-8 mb-2" />
                <span>Add Expense</span>
              </Button>
              
              <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
                <Calendar className="h-8 w-8 mb-2" />
                <span>View Reports</span>
              </Button>
              
              <Button variant="secondary" className="h-24 flex flex-col items-center justify-center">
                <Users className="h-8 w-8 mb-2" />
                <span>Manage Business</span>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}