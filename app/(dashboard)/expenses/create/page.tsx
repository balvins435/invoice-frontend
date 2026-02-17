'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, TrendingDown } from 'lucide-react';

import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { apiService } from '@/lib/api';
import { Business } from '@/types';
import toast from 'react-hot-toast';

export default function CreateExpensePage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await apiService.business.getAll();
        const list = response.data.results || response.data;
        setBusinesses(list);
      } catch {
        toast.error('Failed to load businesses');
      }
    };

    fetchBusinesses();
  }, []);

  const handleSuccess = () => {
    router.push('/expenses');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Add New Expense</h1>
          <p className="text-muted-foreground">
            Record a new business expense and attach receipts
          </p>
        </div>
        <Link href="/expenses">
          <Button variant="outline">View All Expenses</Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <ExpenseForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            businesses={businesses}
            selectedBusinessId={selectedBusinessId}
            onBusinessChange={setSelectedBusinessId}
          />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense Checklist</CardTitle>
              <CardDescription>Before you save this expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <Receipt className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <span className="text-sm text-muted-foreground">Correct category selected</span>
                </div>
                <span className="font-semibold text-green-600">Required</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                    <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span className="text-sm text-muted-foreground">Amount and date filled in</span>
                </div>
                <span className="font-semibold text-blue-600">Required</span>
              </div>
              <div className="mt-2 rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Optional but recommended: attach a receipt to keep clean records for reporting and audits.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p>Keep digital receipts. They are easier to track and audit.</p>
                <p>Mark tax-deductible expenses correctly to simplify reporting.</p>
                <p>Record expenses close to the transaction date for accuracy.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
