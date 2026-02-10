'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2,
  TrendingUp,
  PieChart,
  Calendar,
  Tag
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/StatCard';
import { apiService } from '@/lib/api';
import { Expense, ExpenseFilters, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryChart, setShowCategoryChart] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.expenses.getAll(filters);
      setExpenses(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      await apiService.expenses.delete(selectedExpense.id);
      toast.success('Expense deleted successfully');
      fetchExpenses();
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const expenseSummary = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    deductible: expenses.filter(e => e.tax_deductible).reduce((sum, e) => sum + e.amount, 0),
    nonDeductible: expenses.filter(e => !e.tax_deductible).reduce((sum, e) => sum + e.amount, 0),
    byCategory: expenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>),
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topCategories = Object.entries(expenseSummary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <>
      <Navbar 
        title="Expenses" 
        subtitle="Track and manage your business expenses"
      />
      
      <main className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Expenses"
            value={expenseSummary.totalAmount}
            icon={TrendingUp}
            color="danger"
            formatCurrency
          />
          
          <StatCard
            title="Tax Deductible"
            value={expenseSummary.deductible}
            icon={Tag}
            color="success"
            formatCurrency
          />
          
          <StatCard
            title="Non-Deductible"
            value={expenseSummary.nonDeductible}
            icon={Tag}
            color="warning"
            formatCurrency
          />
          
          <Card className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={() => setShowCategoryChart(true)}>
            <PieChart className="h-8 w-8 text-primary-600 mb-2" />
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(expenseSummary.byCategory).length}</p>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                className="w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button
                variant="secondary"
                onClick={() => {
                  const csvData = [
                    ['Title', 'Category', 'Amount', 'Date', 'Tax Deductible'],
                    ...filteredExpenses.map(e => [
                      e.title,
                      e.category,
                      e.amount,
                      e.expense_date,
                      e.tax_deductible ? 'Yes' : 'No'
                    ])
                  ];
                  
                  const csvContent = csvData.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Link href="/dashboard/expenses/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="input-primary"
                    value={filters.category || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      category: e.target.value as ExpenseCategory,
                    })}
                  >
                    <option value="">All Categories</option>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      date_from: e.target.value,
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      date_to: e.target.value,
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Deductible
                  </label>
                  <select
                    className="input-primary"
                    value={filters.tax_deductible === undefined ? '' : filters.tax_deductible.toString()}
                    onChange={(e) => setFilters({
                      ...filters,
                      tax_deductible: e.target.value === '' ? undefined : e.target.value === 'true',
                    })}
                  >
                    <option value="">All</option>
                    <option value="true">Deductible Only</option>
                    <option value="false">Non-Deductible Only</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Expenses Table */}
        <Card>
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-500">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No expenses found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try changing your search query' : 'Get started by adding your first expense'}
              </p>
              <Link href="/dashboard/expenses/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Title</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Tax Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(expense.expense_date)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{expense.title}</div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="secondary">
                          {EXPENSE_CATEGORIES[expense.category as ExpenseCategory] || expense.category}
                        </Badge>
                      </td>
                      <td className="table-cell font-semibold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="table-cell">
                        {expense.tax_deductible ? (
                          <Badge variant="success">Tax Deductible</Badge>
                        ) : (
                          <Badge variant="secondary">Not Deductible</Badge>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-danger-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Category Chart Modal */}
      <Modal
        isOpen={showCategoryChart}
        onClose={() => setShowCategoryChart(false)}
        title="Expense Categories Breakdown"
        size="lg"
      >
        <div className="space-y-6">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400 mt-2">(Recharts integration needed)</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Category Summary</h4>
            {topCategories.map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-primary-500 mr-3"></div>
                  <span className="font-medium">
                    {EXPENSE_CATEGORIES[category as ExpenseCategory] || category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(amount)}</p>
                  <p className="text-sm text-gray-500">
                    {((amount / expenseSummary.totalAmount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete expense{' '}
            <span className="font-semibold">{selectedExpense?.title}</span>?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}