'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, TrendingDown } from 'lucide-react';

import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateExpensePage() {
  const router = useRouter();

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
          />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
              <CardDescription>Your expense summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-300" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Total Expenses
                  </span>
                </div>
                <span className="font-semibold">KES 45,230</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <Receipt className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Tax Deductible
                  </span>
                </div>
                <span className="font-semibold text-green-600">KES 38,450</span>
              </div>
              <div className="mt-2 rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  You've recorded 12 expenses this month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Tax Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Keep Digital Records</AlertTitle>
                <AlertDescription className="text-xs">
                  Scan and upload receipts immediately to avoid losing them. 
                  Digital copies are accepted by KRA.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTitle>Common Deductions</AlertTitle>
                <AlertDescription className="text-xs">
                  Don't forget: internet, phone, transport, and office supplies 
                  are all tax deductible.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTitle>Deadline Reminder</AlertTitle>
                <AlertDescription className="text-xs">
                  Record expenses within 30 days for accurate monthly reporting.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Quick Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Add</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {commonExpenses.map((expense) => (
                  <Button
                    key={expense.id}
                    variant="outline"
                    className="h-auto flex-col py-3 text-xs"
                    onClick={() => {
                      // Pre-fill form with common expense
                      const titleInput = document.getElementById('title');
                      if (titleInput) {
                        titleInput.value = expense.title;
                        // Trigger change event
                        const event = new Event('input', { bubbles: true });
                        titleInput.dispatchEvent(event);
                      }
                    }}
                  >
                    <span className="text-lg">{expense.icon}</span>
                    <span className="mt-1">{expense.title}</span>
                    <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      ~{expense.amount}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Common expenses for quick add
const commonExpenses = [
  { id: 1, title: 'Internet', icon: '📶', amount: 'KES 3,500' },
  { id: 2, title: 'Airtime', icon: '📱', amount: 'KES 1,000' },
  { id: 3, title: 'Fuel', icon: '⛽', amount: 'KES 5,000' },
  { id: 4, title: 'Lunch', icon: '🍱', amount: 'KES 500' },
  { id: 5, title: 'Office Rent', icon: '🏢', amount: 'KES 25,000' },
  { id: 6, title: 'Cleaning', icon: '🧹', amount: 'KES 2,000' },
];