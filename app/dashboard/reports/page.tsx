'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  PieChart,
  BarChart3,
  Filter
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/StatCard';
import { apiService } from '@/lib/api';
import { MonthlyReport, TaxSummary, ProfitLossStatement } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function ReportsPage() {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    fetchReports();
  }, [selectedYear, selectedMonth]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      
      // Fetch monthly report
      const params = {
        year: selectedYear,
        ...(selectedMonth && { month: selectedMonth }),
      };
      
      const monthlyResponse = await apiService.reports.getMonthlyReport(params);
      setMonthlyReports(Array.isArray(monthlyResponse.data) ? monthlyResponse.data : [monthlyResponse.data]);

      // Fetch tax summary
      const taxResponse = await apiService.reports.getTaxSummary(params);
      setTaxSummary(taxResponse.data);

      // Calculate profit/loss from monthly data
      const currentReport = Array.isArray(monthlyResponse.data) 
        ? monthlyResponse.data[0] 
        : monthlyResponse.data;
      
      if (currentReport) {
        setProfitLoss({
          revenue: {
            total: currentReport.total_income,
            breakdown: [
              { source: 'Invoice Payments', amount: currentReport.total_income, percentage: 100 }
            ]
          },
          expenses: {
            total: currentReport.total_expenses,
            breakdown: Object.entries(currentReport).filter(([key]) => key.includes('expense')).map(([key, value]) => ({
              category: key.replace('_', ' ').toUpperCase(),
              amount: value as number,
              percentage: ((value as number) / currentReport.total_expenses) * 100
            }))
          },
          net_profit: currentReport.net_profit,
          profit_margin: (currentReport.net_profit / currentReport.total_income) * 100
        });
      }

    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const currentReport = monthlyReports[0] || null;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generatePDFReport = async () => {
    try {
      toast.success('Generating PDF report...');
      // PDF generation logic would go here
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const exportToExcel = () => {
    const data = [
      ['Month', 'Income', 'Expenses', 'Net Profit', 'Tax Owed'],
      ...monthlyReports.map(report => [
        report.month,
        report.total_income,
        report.total_expenses,
        report.net_profit,
        report.tax_owed
      ])
    ];
    
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-report-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Report exported successfully');
  };

  return (
    <>
      <Navbar 
        title="Reports" 
        subtitle="Financial insights and analytics for your business"
      />
      
      <main className="p-6">
        {/* Report Controls */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  className="input-primary"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  className="input-primary"
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Months</option>
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  placeholderText="Select date range"
                  className="input-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={exportToExcel}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Button onClick={generatePDFReport}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Current Period Summary */}
        {currentReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Income"
              value={currentReport.total_income}
              icon={TrendingUp}
              color="success"
              formatCurrency
              subtitle={`${currentReport.invoice_count} invoices`}
            />
            
            <StatCard
              title="Total Expenses"
              value={currentReport.total_expenses}
              icon={TrendingDown}
              color="danger"
              formatCurrency
              subtitle={`${currentReport.expense_count} expenses`}
            />
            
            <StatCard
              title="Net Profit"
              value={currentReport.net_profit}
              icon={DollarSign}
              color="primary"
              formatCurrency
              subtitle={`${((currentReport.net_profit / currentReport.total_income) * 100).toFixed(1)}% margin`}
            />
            
            <StatCard
              title="Tax Owed"
              value={currentReport.tax_owed}
              icon={Percent}
              color="warning"
              formatCurrency
              subtitle="16% VAT Rate"
            />
          </div>
        )}

        {/* Charts and Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <Card title="Monthly Financial Trend" actions={
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          }>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Monthly trend chart would go here</p>
                <p className="text-sm text-gray-400 mt-2">(Recharts integration needed)</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {monthlyReports.slice(0, 6).map((report) => (
                <div key={report.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{report.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-success-600">
                      {formatCurrency(report.total_income)}
                    </span>
                    <span className="text-sm text-danger-600">
                      {formatCurrency(report.total_expenses)}
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(report.net_profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expense Breakdown */}
          <Card title="Expense Breakdown" actions={
            <Button variant="ghost" size="sm">
              <PieChart className="h-4 w-4" />
            </Button>
          }>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Expense breakdown chart would go here</p>
                <p className="text-sm text-gray-400 mt-2">(Recharts integration needed)</p>
              </div>
            </div>
            {profitLoss?.expenses.breakdown.length > 0 && (
              <div className="mt-4 space-y-3">
                {profitLoss.expenses.breakdown.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Tax Summary */}
        {taxSummary && (
          <Card title="Tax Summary" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-2">Total Tax Collected</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(taxSummary.total_tax_collected)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-2">Tax Deductible Expenses</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(taxSummary.total_tax_deductible)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 mb-2">Net Tax Liability</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(taxSummary.net_tax_liability)}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Monthly Tax Overview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header">Month</th>
                      <th className="table-header">Tax Collected</th>
                      <th className="table-header">Tax Deductible</th>
                      <th className="table-header">Net Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {taxSummary.by_month.slice(0, 6).map((month, index) => (
                      <tr key={index}>
                        <td className="table-cell">{month.month}</td>
                        <td className="table-cell text-green-600 font-medium">
                          {formatCurrency(month.tax_collected)}
                        </td>
                        <td className="table-cell text-blue-600 font-medium">
                          {formatCurrency(month.tax_deductible)}
                        </td>
                        <td className="table-cell font-bold">
                          {formatCurrency(month.tax_collected - month.tax_deductible)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Profit & Loss Statement */}
        {profitLoss && (
          <Card title="Profit & Loss Statement">
            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Revenue</h4>
                <div className="space-y-2">
                  {profitLoss.revenue.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>{item.source}</span>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold text-lg">{formatCurrency(profitLoss.revenue.total)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Expenses</h4>
                <div className="space-y-2">
                  {profitLoss.expenses.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span>{item.category}</span>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border border-red-200">
                    <span className="font-semibold">Total Expenses</span>
                    <span className="font-bold text-lg">{formatCurrency(profitLoss.expenses.total)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div>
                    <p className="font-semibold text-primary-900">Net Profit</p>
                    <p className="text-sm text-primary-700">Profit Margin: {profitLoss.profit_margin.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${profitLoss.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss.net_profit)}
                    </p>
                    <p className="text-sm text-primary-700">
                      {profitLoss.net_profit >= 0 ? '✅ Profitable' : '⚠️ Loss'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}