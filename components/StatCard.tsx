'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  formatCurrency?: boolean;
  subtitle?: string;
}

const colorClasses = {
  primary: 'bg-primary-50 text-primary-600 border-primary-200',
  success: 'bg-success-50 text-success-600 border-success-200',
  warning: 'bg-warning-50 text-warning-600 border-warning-200',
  danger: 'bg-danger-50 text-danger-600 border-danger-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'gray',
  formatCurrency: shouldFormat = false,
  subtitle,
}) => {
  const displayValue = shouldFormat && typeof value === 'number' 
    ? formatCurrency(value) 
    : value;

  const isPositive = change && change > 0;

  return (
    <div className={cn(
      'rounded-xl border p-6',
      colorClasses[color]
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && <Icon className="h-5 w-5 opacity-75" />}
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">
          {displayValue}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center text-sm">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-danger-500 mr-1" />
          )}
          <span className={cn(
            'font-medium',
            isPositive ? 'text-success-600' : 'text-danger-600'
          )}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      )}
    </div>
  );
};