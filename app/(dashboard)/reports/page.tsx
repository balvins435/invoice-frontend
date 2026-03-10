'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  FileText,
  Percent,
  PieChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import 'chart.js/auto';
import 'react-datepicker/dist/react-datepicker.css';

import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { MonthlyReport, ProfitLossStatement, TaxSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="flex min-w-[140px] flex-col gap-1">
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-0 transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {children}
    </select>
  </div>
);

export default function ReportsPage() {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
    []
  );

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { year: selectedYear, ...(selectedMonth && { month: selectedMonth }) };
      const [monthlyResponse, taxResponse] = await Promise.all([
        apiService.reports.getMonthlyReport(params),
        apiService.reports.getTaxSummary(params),
      ]);

      setMonthlyReports(
        Array.isArray(monthlyResponse.data) ? monthlyResponse.data : [monthlyResponse.data]
      );
      setTaxSummary(taxResponse.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const currentReport = useMemo<MonthlyReport | null>(() => {
    if (selectedMonth) return monthlyReports[0] || null;
    if (!monthlyReports.length) return null;

    return {
      month: `${selectedYear} Total`,
      total_income: monthlyReports.reduce((sum, report) => sum + toNumber(report.total_income), 0),
      total_expenses: monthlyReports.reduce((sum, report) => sum + toNumber(report.total_expenses), 0),
      tax_owed: monthlyReports.reduce((sum, report) => sum + toNumber(report.tax_owed), 0),
      deductible_expenses: monthlyReports.reduce((sum, report) => sum + toNumber(report.deductible_expenses), 0),
      net_profit: monthlyReports.reduce((sum, report) => sum + toNumber(report.net_profit), 0),
      invoice_count: monthlyReports.reduce((sum, report) => sum + toNumber(report.invoice_count), 0),
      expense_count: monthlyReports.reduce((sum, report) => sum + toNumber(report.expense_count), 0),
    };
  }, [monthlyReports, selectedMonth, selectedYear]);

  const profitLoss = useMemo<ProfitLossStatement | null>(() => {
    if (!currentReport) return null;

    const totalIncome = toNumber(currentReport.total_income);
    const totalExpenses = toNumber(currentReport.total_expenses);
    const deductibleExpenses = toNumber(currentReport.deductible_expenses);
    const otherExpenses = Math.max(totalExpenses - deductibleExpenses, 0);
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
            amount: otherExpenses,
            percentage: totalExpenses > 0 ? (otherExpenses / totalExpenses) * 100 : 0,
          },
        ].filter((item) => item.amount > 0),
      },
      net_profit: netProfit,
      profit_margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    };
  }, [currentReport]);

  const isProfit = currentReport ? toNumber(currentReport.net_profit) >= 0 : true;

  const monthlyTrendData = useMemo(() => ({
    labels: monthlyReports.map((report) => report.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyReports.map((report) => toNumber(report.total_income)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
        pointBackgroundColor: '#10b981',
        pointBorderWidth: 0,
        pointRadius: 3,
        tension: 0.35,
      },
      {
        label: 'Expenses',
        data: monthlyReports.map((report) => toNumber(report.total_expenses)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.16)',
        pointBackgroundColor: '#ef4444',
        pointBorderWidth: 0,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  }), [monthlyReports]);

  const expenseBreakdownData = useMemo(() => ({
    labels: profitLoss?.expenses.breakdown.map((item) => item.category) || [],
    datasets: [
      {
        data: profitLoss?.expenses.breakdown.map((item) => item.amount) || [],
        backgroundColor: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
        borderWidth: 0,
      },
    ],
  }), [profitLoss]);

  const exportToExcel = () => {
    const data = [
      ['Month', 'Income', 'Expenses', 'Net Profit', 'Tax Owed'],
      ...monthlyReports.map((report) => [
        report.month,
        report.total_income,
        report.total_expenses,
        report.net_profit,
        report.tax_owed,
      ]),
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

  const downloadPdf = async () => {
    const toastId = 'report-pdf';
    try {
      toast.loading('Generating PDF report...', { id: toastId });
      const params = { year: selectedYear, ...(selectedMonth && { month: selectedMonth }) };
      const response = await apiService.reports.downloadPDF(params);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const monthSuffix = selectedMonth ? `-${String(selectedMonth).padStart(2, '0')}` : '';

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${selectedYear}${monthSuffix}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report downloaded', { id: toastId });
    } catch {
      toast.error('Failed to download PDF', { id: toastId });
    }
  };

  return (
    <>
      <Navbar title="Reports" subtitle="Financial insights and analytics for your business" />

      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overview</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Reports</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Clean monthly trends, tax summaries, and profit performance.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <FileText className="h-4 w-4" /> Download PDF
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Year" value={selectedYear} onChange={(value) => setSelectedYear(Number(value))}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </SelectField>

              <SelectField
                label="Month"
                value={selectedMonth || ''}
                onChange={(value) => setSelectedMonth(value ? Number(value) : null)}
              >
                <option value="">All Months</option>
                {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </SelectField>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Range</label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable
                  placeholderText="Pick custom range"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : currentReport ? (
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <span className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-950/40"><TrendingUp className="h-4 w-4 text-emerald-600" /></span>
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Income</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(currentReport.total_income)}</p>
                <p className="mt-1 text-xs text-slate-500">{currentReport.invoice_count} invoices</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <span className="rounded-xl bg-red-50 p-2.5 dark:bg-red-950/40"><TrendingDown className="h-4 w-4 text-red-500" /></span>
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Expenses</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(currentReport.total_expenses)}</p>
                <p className="mt-1 text-xs text-slate-500">{currentReport.expense_count} expenses</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <span className={`rounded-xl p-2.5 ${isProfit ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
                    <Percent className={`h-4 w-4 ${isProfit ? 'text-blue-600' : 'text-red-500'}`} />
                  </span>
                  {isProfit ? <ArrowUpRight className="h-4 w-4 text-blue-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Net Profit</p>
                <p className={`mt-1 text-xl font-bold ${isProfit ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                  {formatCurrency(currentReport.net_profit)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{profitLoss?.profit_margin.toFixed(1) || '0.0'}% margin</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <span className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/40"><BarChart3 className="h-4 w-4 text-amber-600" /></span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Tax Owed</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(currentReport.tax_owed)}</p>
                <p className="mt-1 text-xs text-slate-500">VAT summary</p>
              </div>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Trend</h3>
                  <p className="text-xs text-slate-500">Income vs expenses by month</p>
                </div>
                <span className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"><BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-300" /></span>
              </div>
              <div className="h-72 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <Line
                  data={monthlyTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
                      },
                    },
                    scales: {
                      y: { beginAtZero: true, grid: { color: 'rgba(34, 119, 238, 0.2)' } },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Expense Mix</h3>
                  <p className="text-xs text-slate-500">Category distribution</p>
                </div>
                <span className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"><PieChart className="h-4 w-4 text-slate-600 dark:text-slate-300" /></span>
              </div>

              <div className="h-72 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                {profitLoss?.expenses.breakdown.length ? (
                  <Doughnut
                    data={expenseBreakdownData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
                        },
                      },
                      cutout: '64%',
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No expense data available</div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Performance</h3>
            <p className="mb-4 text-xs text-slate-500">Detailed month-by-month cash movement</p>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-3">Month</th>
                    <th className="px-3 py-3">Income</th>
                    <th className="px-3 py-3">Expenses</th>
                    <th className="px-3 py-3">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReports.map((report) => (
                    <tr key={report.month} className="border-b border-slate-50 dark:border-slate-800/70">
                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{report.month}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-600">+{formatCurrency(report.total_income)}</td>
                      <td className="px-3 py-3 font-semibold text-red-500">-{formatCurrency(report.total_expenses)}</td>
                      <td className={`px-3 py-3 font-semibold ${toNumber(report.net_profit) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                        {formatCurrency(report.net_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {monthlyReports.map((report) => (
                <div key={report.month} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{report.month}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Income</p>
                      <p className="font-semibold text-emerald-600">+{formatCurrency(report.total_income)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Expenses</p>
                      <p className="font-semibold text-red-500">-{formatCurrency(report.total_expenses)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Net</p>
                      <p className={`font-semibold ${toNumber(report.net_profit) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                        {formatCurrency(report.net_profit)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {taxSummary && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tax Summary</h3>
              <p className="mb-4 text-xs text-slate-500">Collected vs deductible tax and net liability</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Tax Collected</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(taxSummary.total_tax_collected)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Tax Deductible</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(taxSummary.total_tax_deductible)}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Net Liability</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(taxSummary.net_tax_liability)}</p>
                </div>
              </div>

              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                      <th className="px-3 py-3">Month</th>
                      <th className="px-3 py-3">Collected</th>
                      <th className="px-3 py-3">Deductible</th>
                      <th className="px-3 py-3">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxSummary.by_month.map((month) => (
                      <tr key={month.month} className="border-b border-slate-50 dark:border-slate-800/70">
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{month.month}</td>
                        <td className="px-3 py-3 font-semibold text-blue-600">{formatCurrency(month.tax_collected)}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-600">{formatCurrency(month.tax_deductible)}</td>
                        <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(month.tax_collected - month.tax_deductible)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
