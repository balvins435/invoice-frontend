'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  PieChart,
  BarChart3,
  ChevronDown,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { MonthlyReport, TaxSummary, ProfitLossStatement } from '@/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { Line, Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import 'react-datepicker/dist/react-datepicker.css';

export default function ReportsPage() {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  useEffect(() => { fetchReports(); }, [selectedYear, selectedMonth]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const params = { year: selectedYear, ...(selectedMonth && { month: selectedMonth }) };
      const [monthlyResponse, taxResponse] = await Promise.all([
        apiService.reports.getMonthlyReport(params),
        apiService.reports.getTaxSummary(params),
      ]);
      setMonthlyReports(Array.isArray(monthlyResponse.data) ? monthlyResponse.data : [monthlyResponse.data]);
      setTaxSummary(taxResponse.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = [
      ['Month', 'Income', 'Expenses', 'Net Profit', 'Tax Owed'],
      ...monthlyReports.map((r) => [r.month, r.total_income, r.total_expenses, r.net_profit, r.tax_owed]),
    ];
    const csvContent = data.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Report exported successfully');
  };

  const generatePDF = () => toast.success('Generating PDF report…');

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const currentReport = selectedMonth
    ? monthlyReports[0] || null
    : (monthlyReports.length > 0
      ? {
          month: `${selectedYear} Total`,
          total_income: monthlyReports.reduce((sum, report) => sum + toNumber(report.total_income), 0),
          total_expenses: monthlyReports.reduce((sum, report) => sum + toNumber(report.total_expenses), 0),
          tax_owed: monthlyReports.reduce((sum, report) => sum + toNumber(report.tax_owed), 0),
          deductible_expenses: monthlyReports.reduce((sum, report) => sum + toNumber(report.deductible_expenses), 0),
          net_profit: monthlyReports.reduce((sum, report) => sum + toNumber(report.net_profit), 0),
          invoice_count: monthlyReports.reduce((sum, report) => sum + toNumber(report.invoice_count), 0),
          expense_count: monthlyReports.reduce((sum, report) => sum + toNumber(report.expense_count), 0),
        }
      : null);

  const profitLoss: ProfitLossStatement | null = useMemo(() => {
    if (!currentReport) return null;

    const totalIncome = toNumber(currentReport.total_income);
    const totalExpenses = toNumber(currentReport.total_expenses);
    const deductibleExpenses = toNumber(currentReport.deductible_expenses);
    const nonDeductibleExpenses = Math.max(totalExpenses - deductibleExpenses, 0);
    const netProfit = toNumber(currentReport.net_profit);

    return {
      revenue: {
        total: totalIncome,
        breakdown: [{ source: 'Invoice Payments', amount: totalIncome, percentage: 100 }],
      },
      expenses: {
        total: totalExpenses,
        breakdown: [
          {
            category: 'Deductible Expenses',
            amount: deductibleExpenses,
            percentage: totalExpenses > 0 ? (deductibleExpenses / totalExpenses) * 100 : 0,
          },
          {
            category: 'Other Expenses',
            amount: nonDeductibleExpenses,
            percentage: totalExpenses > 0 ? (nonDeductibleExpenses / totalExpenses) * 100 : 0,
          },
        ].filter((item) => item.amount > 0),
      },
      net_profit: netProfit,
      profit_margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    };
  }, [currentReport]);

  const profitMargin = currentReport && currentReport.total_income > 0
    ? ((currentReport.net_profit / currentReport.total_income) * 100).toFixed(1)
    : '0.0';

  const isProfit = currentReport ? currentReport.net_profit >= 0 : true;
  const monthlyTrendData = {
    labels: monthlyReports.map((report) => report.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyReports.map((report) => toNumber(report.total_income)),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
        tension: 0.35,
      },
      {
        label: 'Expenses',
        data: monthlyReports.map((report) => toNumber(report.total_expenses)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.16)',
        tension: 0.35,
      },
    ],
  };
  const expenseBreakdownData = {
    labels: profitLoss?.expenses.breakdown.map((item) => item.category) || [],
    datasets: [
      {
        data: profitLoss?.expenses.breakdown.map((item) => item.amount) || [],
        backgroundColor: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
        borderWidth: 0,
      },
    ],
  };

  // ── Reusable select wrapper ──
  const SelectField = ({ label, value, onChange, children }: {
    label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      </div>
    </div>
  );

  return (
    <>
      <Navbar title="Reports" subtitle="Financial insights and analytics for your business" />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-950 p-6 lg:p-8 transition-colors duration-200">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Financial Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Insights and analytics for your business
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={generatePDF}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <SelectField
                label="Year"
                value={selectedYear}
                onChange={(v) => setSelectedYear(Number(v))}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </SelectField>

              <SelectField
                label="Month"
                value={selectedMonth || ''}
                onChange={(v) => setSelectedMonth(v ? Number(v) : null)}
              >
                <option value="">All Months</option>
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </SelectField>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Date Range
                </label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable
                  placeholderText="Pick a range"
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors w-52"
                />
              </div>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : currentReport ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

              {/* Income */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Total Income
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(currentReport.total_income)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {currentReport.invoice_count} invoices
                  </p>
                </div>
              </div>

              {/* Expenses */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                    <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
                  </div>
                  <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Total Expenses
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(currentReport.total_expenses)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {currentReport.expense_count} expenses
                  </p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isProfit ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-red-50 dark:bg-red-950/50'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      isProfit ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'
                    }`} />
                  </div>
                  {isProfit
                    ? <ArrowUpRight className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    : <ArrowDownRight className="h-4 w-4 text-red-500 dark:text-red-400" />
                  }
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Net Profit
                  </p>
                  <p className={`mt-1 text-xl font-bold ${
                    isProfit ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(currentReport.net_profit)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {profitMargin}% margin
                  </p>
                </div>
              </div>

              {/* Tax Owed */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                    <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Minus className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Tax Owed
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(currentReport.tax_owed)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    16% VAT rate
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Monthly Trend */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Trend</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Income vs Expenses</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              <div className="mx-6 mt-5 h-56 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
                <Line
                  data={monthlyTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 10,
                          boxHeight: 10,
                        },
                      },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>

              {/* Data rows */}
              <div className="p-6 space-y-1">
                {monthlyReports.slice(0, 5).map((report) => (
                  <div key={report.month} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 shrink-0">
                      {report.month}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        +{formatCurrency(report.total_income)}
                      </span>
                      <span className="text-red-500 dark:text-red-400 font-medium tabular-nums">
                        -{formatCurrency(report.total_expenses)}
                      </span>
                      <span className={`font-semibold tabular-nums ${
                        report.net_profit >= 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(report.net_profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Expense Breakdown</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By category</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <PieChart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              <div className="mx-6 mt-5 h-56 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
                {profitLoss?.expenses.breakdown.length ? (
                  <Doughnut
                    data={expenseBreakdownData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                          },
                        },
                      },
                      cutout: '62%',
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Progress bars */}
              <div className="p-6 space-y-3">
                {profitLoss?.expenses.breakdown.length ? (
                  profitLoss.expenses.breakdown.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                        <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                          {formatCurrency(item.amount)}
                          <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                    No expense data available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Tax Summary ── */}
          {taxSummary && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Tax Summary</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  VAT collected, deductibles, and net liability
                </p>
              </div>

              {/* Tax KPIs */}
              <div className="grid grid-cols-1 gap-px bg-gray-100 dark:bg-gray-800 md:grid-cols-3">
                <div className="bg-white dark:bg-gray-900 p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400">
                    Tax Collected
                  </p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(taxSummary.total_tax_collected)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                    Tax Deductible
                  </p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(taxSummary.total_tax_deductible)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                    Net Liability
                  </p>
                  <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(taxSummary.net_tax_liability)}
                  </p>
                </div>
              </div>

              {/* Tax table */}
              <div className="p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Monthly Breakdown
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        {['Month', 'Tax Collected', 'Tax Deductible', 'Net Tax'].map((h) => (
                          <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 pr-6">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {taxSummary.by_month.slice(0, 6).map((month, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 pr-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {month.month}
                          </td>
                          <td className="py-3 pr-6 text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                            {formatCurrency(month.tax_collected)}
                          </td>
                          <td className="py-3 pr-6 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(month.tax_deductible)}
                          </td>
                          <td className="py-3 text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatCurrency(month.tax_collected - month.tax_deductible)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Profit & Loss Statement ── */}
          {profitLoss && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Profit & Loss Statement</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Full revenue, expense, and net profit breakdown
                </p>
              </div>

              <div className="p-6 space-y-6">

                {/* Revenue */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Revenue
                  </p>
                  <div className="space-y-2">
                    {profitLoss.revenue.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-4 py-3">
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          {item.source}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 tabular-nums">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Revenue total */}
                    <div className="flex items-center justify-between rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-4 py-3">
                      <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        Total Revenue
                      </span>
                      <span className="text-base font-bold text-emerald-900 dark:text-emerald-100 tabular-nums">
                        {formatCurrency(profitLoss.revenue.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Expenses */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    Expenses
                  </p>
                  <div className="space-y-2">
                    {profitLoss.expenses.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-4 py-3">
                        <span className="text-sm font-medium text-red-800 dark:text-red-300">
                          {item.category}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-900 dark:text-red-200 tabular-nums">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Expenses total */}
                    <div className="flex items-center justify-between rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 px-4 py-3">
                      <span className="text-sm font-bold text-red-900 dark:text-red-100">
                        Total Expenses
                      </span>
                      <span className="text-base font-bold text-red-900 dark:text-red-100 tabular-nums">
                        {formatCurrency(profitLoss.expenses.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* Net Profit */}
                <div className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                  profitLoss.net_profit >= 0
                    ? 'border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20'
                }`}>
                  <div>
                    <p className={`text-sm font-bold ${
                      profitLoss.net_profit >= 0
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      Net Profit
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      profitLoss.net_profit >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {profitLoss.profit_margin.toFixed(1)}% profit margin ·{' '}
                      {profitLoss.net_profit >= 0 ? 'Profitable period' : 'Loss period'}
                    </p>
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${
                    profitLoss.net_profit >= 0
                      ? 'text-blue-700 dark:text-blue-200'
                      : 'text-red-700 dark:text-red-200'
                  }`}>
                    {formatCurrency(profitLoss.net_profit)}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
