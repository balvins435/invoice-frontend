'use client';

import React, { useMemo } from 'react';
import { Receipt, Percent, Calculator, TrendingUp, FileText, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceSummaryProps {
  items: Array<{
    description: any; quantity: number; unit_price: number; total: number 
}>;
  taxRate: number;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ items, taxRate }) => {
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * taxRate) / 100;
  }, [subtotal, taxRate]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const itemCount = useMemo(() => {
    return items.filter(item => item.description.trim() !== '').length;
  }, [items]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 px-6 py-4 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
              <p className="text-sm text-gray-600">Breakdown of charges and taxes</p>
            </div>
          </div>
          
          {/* Tax Rate Badge */}
          <div className="bg-white px-4 py-2 rounded-lg border border-primary-200 shadow-sm">
            <span className="text-sm font-medium text-primary-700 flex items-center">
              <Percent className="h-4 w-4 mr-1" />
              VAT: {taxRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Calculations */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Calculator className="h-4 w-4 mr-2 text-gray-400" />
                  Subtotal
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-gray-400" />
                  VAT ({taxRate}%)
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    Total Amount
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(totalAmount)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">KES</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <FileText className="h-4 w-4 text-primary-600" />
                  <span className="text-xs text-primary-600 font-medium">Items</span>
                </div>
                <p className="text-xl font-bold text-primary-700">{itemCount}</p>
                <p className="text-xs text-primary-600 mt-1">Total line items</p>
              </div>
              
              <div className="bg-success-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <TrendingUp className="h-4 w-4 text-success-600" />
                  <span className="text-xs text-success-600 font-medium">Average</span>
                </div>
                <p className="text-xl font-bold text-success-700">
                  {itemCount > 0 
                    ? formatCurrency(subtotal / itemCount)
                    : formatCurrency(0)
                  }
                </p>
                <p className="text-xs text-success-600 mt-1">Per item</p>
              </div>
            </div>
          </div>

          {/* Right Column - Summary Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-6 text-white">
            <h4 className="text-sm font-medium text-primary-100 mb-4">
              Amount Due
            </h4>
            
            <div className="space-y-4">
              <div>
                <span className="text-3xl font-bold">
                  {formatCurrency(totalAmount)}
                </span>
                <p className="text-primary-100 text-sm mt-1">
                  Including {formatCurrency(taxAmount)} VAT
                </p>
              </div>
              
              <div className="border-t border-primary-500 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-100">Issue Date:</span>
                  <span className="font-medium">Today</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-primary-100">Due Date:</span>
                  <span className="font-medium">30 days from issue</span>
                </div>
              </div>

              {/* Payment Terms Hint */}
              <div className="mt-4 p-3 bg-primary-500/30 rounded-lg">
                <p className="text-xs text-primary-100">
                  ⚡ Payment terms: Net 30. A 2% discount for payments within 7 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Tax Information */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">VAT Information:</p>
            <p>
              VAT is calculated at {taxRate}% based on your business settings. 
              This amount represents the tax you will collect from your client 
              and remit to the tax authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};