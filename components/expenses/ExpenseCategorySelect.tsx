'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Search, Check, Briefcase, Coffee, Car, Home,
  ShoppingBag, Wifi, CreditCard, Printer, Heart, BookOpen,
  Users, Package, PenTool, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/expense';

// ── Category metadata ─────────────────────────────────────────────────────────
const CATEGORIES_WITH_META = [
  { value: 'office_supplies', label: 'Office Supplies',         icon: Briefcase,   color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { value: 'travel',          label: 'Travel & Transportation', icon: Car,         color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { value: 'marketing',       label: 'Marketing & Advertising', icon: PenTool,     color: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800' },
  { value: 'utilities',       label: 'Utilities',               icon: Wifi,        color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { value: 'rent',            label: 'Rent',                    icon: Home,        color: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  { value: 'salaries',        label: 'Salaries & Wages',        icon: Users,       color: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  { value: 'equipment',       label: 'Equipment',               icon: Printer,     color: 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' },
  { value: 'software',        label: 'Software & Subscriptions',icon: CreditCard,  color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  { value: 'meals',           label: 'Meals & Entertainment',   icon: Coffee,      color: 'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  { value: 'healthcare',      label: 'Healthcare',              icon: Heart,       color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { value: 'education',       label: 'Education & Training',    icon: BookOpen,    color: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
  { value: 'shopping',        label: 'Shopping',                icon: ShoppingBag, color: 'bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800' },
  { value: 'other',           label: 'Other',                   icon: MoreHorizontal, color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
];

const CATEGORY_MAP = CATEGORIES_WITH_META.reduce((acc, c) => {
  acc[c.value] = c;
  return acc;
}, {} as Record<string, typeof CATEGORIES_WITH_META[0]>);

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  value?: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ExpenseCategorySelect: React.FC<Props> = ({
  value, onChange, error, label = 'Category', required, disabled, className, placeholder = 'Select a category',
}) => {
  const [isOpen, setIsOpen]           = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const searchRef     = useRef<HTMLInputElement>(null);

  const selected = value ? CATEGORY_MAP[value] : null;
  const filtered = CATEGORIES_WITH_META.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Click outside ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Focus search when opened ────────────────────────────────────────────────
  useEffect(() => { if (isOpen && searchRef.current) searchRef.current.focus(); }, [isOpen]);

  // ── Keyboard nav ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlighted(p => (p < filtered.length - 1 ? p + 1 : p));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlighted(p => (p > 0 ? p - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlighted >= 0 && filtered[highlighted]) {
            onChange(filtered[highlighted].value as ExpenseCategory);
            setIsOpen(false);
            setSearchQuery('');
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchQuery('');
          break;
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, filtered, highlighted, onChange]);

  useEffect(() => { setHighlighted(-1); }, [filtered]);

  const handleSelect = (categoryValue: string) => {
    onChange(categoryValue as ExpenseCategory);
    setIsOpen(false);
    setSearchQuery('');
  };

  const Icon = selected?.icon || Briefcase;

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors',
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-red-400 dark:border-red-600'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selected && (
            <div className={cn('flex h-6 w-6 items-center justify-center rounded-lg border', selected.color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <span className={cn('truncate', !selected && 'text-gray-400 dark:text-gray-500')}>
            {selected?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">

          {/* Search */}
          <div className="sticky top-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search categories…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <Search className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">No categories found</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filtered.map((category, i) => {
                const CategoryIcon = category.icon;
                const isHighlighted = i === highlighted;
                const isSelected    = value === category.value;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleSelect(category.value)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                      isHighlighted && 'bg-gray-50 dark:bg-gray-800/60',
                      isSelected && 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg border', category.color)}>
                      <CategoryIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.label}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-gray-900 dark:text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Category Badge ────────────────────────────────────────────────────────────
export const CategoryBadge: React.FC<{ category: ExpenseCategory; showIcon?: boolean }> = ({
  category, showIcon = true,
}) => {
  const info = CATEGORY_MAP[category] || CATEGORY_MAP.other;
  const Icon = info.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', info.color)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{info.label}</span>
    </span>
  );
};

export const getCategoryDisplay = (category: ExpenseCategory) =>
  CATEGORY_MAP[category] || CATEGORY_MAP.other;