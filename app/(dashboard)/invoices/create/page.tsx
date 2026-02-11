'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { InvoiceForm } from './components/InvoiceForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CreateInvoicePage() {
  const router = useRouter();

  return (
    <>
      <Navbar 
        title="Create New Invoice" 
        subtitle="Fill in the details to generate a professional invoice"
      />
      
      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/dashboard/invoices"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Link>
            
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/invoices">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                form="invoice-form"
                className="bg-primary-600 hover:bg-primary-700"
              >
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Invoice Form */}
          <Card className="p-6">
            <InvoiceForm />
          </Card>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Invoice Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Add clear item descriptions to avoid client confusion</li>
              <li>• Set a reasonable due date (usually 14-30 days)</li>
              <li>• VAT is automatically calculated at 16% (customizable in Business settings)</li>
              <li>• You can save as draft and send later</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}