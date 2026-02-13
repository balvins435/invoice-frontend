'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Search, 
  Check, 
  Briefcase, 
  Coffee, 
  Car, 
  Home, 
  ShoppingBag, 
  Wifi, 
  CreditCard, 
  Printer,
  Heart,
  BookOpen,
  Users,
  Package,
  PenTool,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/expense';

// Extended categories with icons and colors
export const CATEGORIES_WITH_METADATA = [
  { 
    value: 'office_supplies', 
    label: 'Office Supplies', 
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-600',
    description: 'Stationery, printer paper, pens, etc.'
  },
  { 
    value: 'travel', 
    label: 'Travel & Transportation', 
    icon: Car,
    color: 'bg-green-100 text-green-600',
    description: 'Fuel, taxi fares, flights, accommodation'
  },
  { 
    value: 'marketing', 
    label: 'Marketing & Advertising', 
    icon: PenTool,
    color: 'bg-purple-100 text-purple-600',
    description: 'Social media ads, flyers, promotions'
  },
  { 
    value: 'utilities', 
    label: 'Utilities', 
    icon: Wifi,
    color: 'bg-yellow-100 text-yellow-600',
    description: 'Electricity, water, internet, phone bills'
  },
  { 
    value: 'rent', 
    label: 'Rent', 
    icon: Home,
    color: 'bg-orange-100 text-orange-600',
    description: 'Office or workspace rent'
  },
  { 
    value: 'salaries', 
    label: 'Salaries & Wages', 
    icon: Users,
    color: 'bg-indigo-100 text-indigo-600',
    description: 'Employee salaries, wages, benefits'
  },
  { 
    value: 'equipment', 
    label: 'Equipment', 
    icon: Printer,
    color: 'bg-pink-100 text-pink-600',
    description: 'Computers, furniture, machinery'
  },
  { 
    value: 'software', 
    label: 'Software & Subscriptions', 
    icon: CreditCard,
    color: 'bg-cyan-100 text-cyan-600',
    description: 'Monthly software subscriptions, licenses'
  },
  { 
    value: 'meals', 
    label: 'Meals & Entertainment', 
    icon: Coffee,
    color: 'bg-amber-100 text-amber-600',
    description: 'Client meals, team lunches'
  },
  { 
    value: 'healthcare', 
    label: 'Healthcare', 
    icon: Heart,
    color: 'bg-rose-100 text-rose-600',
    description: 'Medical expenses, insurance'
  },
  { 
    value: 'education', 
    label: 'Education & Training', 
    icon: BookOpen,
    color: 'bg-emerald-100 text-emerald-600',
    description: 'Courses, workshops, certifications'
  },
  { 
    value: 'shopping', 
    label: 'Shopping', 
    icon: ShoppingBag,
    color: 'bg-violet-100 text-violet-600',
    description: 'General purchases, supplies'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: MoreHorizontal,
    color: 'bg-gray-100 text-gray-600',
    description: 'Miscellaneous expenses'
  },
];

// Map category values to their metadata
const CATEGORY_MAP = CATEGORIES_WITH_METADATA.reduce((acc, category) => {
  acc[category.value] = category;
  return acc;
}, {} as Record<string, typeof CATEGORIES_WITH_METADATA[0]>);

// Group categories for better organization
const CATEGORY_GROUPS = [
  {
    label: 'Business Operations',
    categories: ['office_supplies', 'rent', 'utilities', 'equipment'],
  },
  {
    label: 'Personnel',
    categories: ['salaries', 'healthcare', 'education', 'meals'],
  },
  {
    label: 'Sales & Marketing',
    categories: ['marketing', 'travel', 'software'],
  },
  {
    label: 'Other',
    categories: ['shopping', 'other'],
  },
];

interface ExpenseCategorySelectProps {
  value?: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showIcon?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

export const ExpenseCategorySelect: React.FC<ExpenseCategorySelectProps> = ({
  value,
  onChange,
  error,
  label = 'Category',
  helperText,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select a category',
  showIcon = true,
  showDescription = false,
  size = 'md',
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedCategory = value ? CATEGORY_MAP[value] : null;

  // Filter categories based on search query
  const filteredCategories = CATEGORIES_WITH_METADATA.filter(category =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Size classes
  const sizeClasses = {
    sm: {
      button: 'py-1.5 px-3 text-sm',
      icon: 'h-4 w-4',
      chevron: 'h-3 w-3',
      dropdown: 'mt-1 max-h-60',
      item: 'py-1.5 px-3 text-sm',
    },
    md: {
      button: 'py-2 px-4',
      icon: 'h-5 w-5',
      chevron: 'h-4 w-4',
      dropdown: 'mt-2 max-h-80',
      item: 'py-2 px-4',
    },
    lg: {
      button: 'py-3 px-6 text-lg',
      icon: 'h-6 w-6',
      chevron: 'h-5 w-5',
      dropdown: 'mt-2 max-h-96',
      item: 'py-3 px-6 text-lg',
    },
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredCategories.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredCategories[highlightedIndex]) {
            onChange(filteredCategories[highlightedIndex].value as ExpenseCategory);
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCategories, highlightedIndex, onChange]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when filtered categories change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredCategories]);

  const handleSelect = (categoryValue: string) => {
    onChange(categoryValue as ExpenseCategory);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Get category icon component
  const CategoryIcon = selectedCategory?.icon || Briefcase;

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between',
          'border border-gray-300 rounded-lg',
          'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'transition-colors duration-200',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-75',
          error && 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
          sizeClasses[size].button
        )}
      >
        <div className="flex items-center space-x-2 truncate">
          {showIcon && selectedCategory && (
            <div className={cn(
              'p-1 rounded',
              selectedCategory.color,
              sizeClasses[size].icon
            )}>
              <CategoryIcon className={sizeClasses[size].icon} />
            </div>
          )}
          <span className={cn(
            'truncate',
            !selectedCategory && 'text-gray-500'
          )}>
            {selectedCategory?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          'text-gray-400 transition-transform duration-200',
          sizeClasses[size].chevron,
          isOpen && 'transform rotate-180'
        )} />
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 w-full',
          'bg-white border border-gray-200 rounded-lg shadow-lg',
          sizeClasses[size].dropdown,
          'overflow-hidden'
        )}>
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="overflow-y-auto max-h-60">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No categories found</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {/* Grouped View */}
                {variant === 'detailed' ? (
                  CATEGORY_GROUPS.map((group) => {
                    const groupCategories = filteredCategories.filter(c => 
                      group.categories.includes(c.value)
                    );
                    
                    if (groupCategories.length === 0) return null;

                    return (
                      <div key={group.label}>
                        <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {group.label}
                        </div>
                        {groupCategories.map((category, index) => {
                          const CategoryIcon = category.icon;
                          const isHighlighted = filteredCategories.findIndex(c => c.value === category.value) === highlightedIndex;
                          const isSelected = value === category.value;

                          return (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => handleSelect(category.value)}
                              className={cn(
                                'w-full flex items-center space-x-3 hover:bg-gray-50 transition-colors',
                                sizeClasses[size].item,
                                isHighlighted && 'bg-gray-50',
                                isSelected && 'bg-primary-50'
                              )}
                            >
                              {showIcon && (
                                <div className={cn(
                                  'p-1 rounded',
                                  category.color
                                )}>
                                  <CategoryIcon className={sizeClasses[size].icon} />
                                </div>
                              )}
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900">
                                  {category.label}
                                </div>
                                {showDescription && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {category.description}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  // Simple List View
                  filteredCategories.map((category, index) => {
                    const CategoryIcon = category.icon;
                    const isHighlighted = index === highlightedIndex;
                    const isSelected = value === category.value;

                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleSelect(category.value)}
                        className={cn(
                          'w-full flex items-center space-x-3 hover:bg-gray-50 transition-colors',
                          sizeClasses[size].item,
                          isHighlighted && 'bg-gray-50',
                          isSelected && 'bg-primary-50'
                        )}
                      >
                        {showIcon && (
                          <div className={cn(
                            'p-1 rounded',
                            category.color
                          )}>
                            <CategoryIcon className={sizeClasses[size].icon} />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">
                            {category.label}
                          </div>
                          {showDescription && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          {variant === 'detailed' && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => handleSelect('other')}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                + Add Custom Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for mobile or limited space
export const CompactExpenseCategorySelect: React.FC<Omit<ExpenseCategorySelectProps, 'variant' | 'showDescription'>> = (props) => {
  return (
    <ExpenseCategorySelect
      {...props}
      variant="compact"
      showDescription={false}
      size="sm"
    />
  );
};

// Detailed version for forms with descriptions
export const DetailedExpenseCategorySelect: React.FC<Omit<ExpenseCategorySelectProps, 'variant'>> = (props) => {
  return (
    <ExpenseCategorySelect
      {...props}
      variant="detailed"
      showDescription={true}
      size="md"
    />
  );
};

// Helper function to get category display info
export const getCategoryDisplay = (category: ExpenseCategory) => {
  return CATEGORY_MAP[category] || {
    label: category,
    icon: MoreHorizontal,
    color: 'bg-gray-100 text-gray-600',
    description: 'Custom category',
  };
};

// Category badge component
interface CategoryBadgeProps {
  category: ExpenseCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
  size = 'md',
}) => {
  const categoryInfo = getCategoryDisplay(category);
  const Icon = categoryInfo.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      container: 'px-2.5 py-1 text-sm',
      icon: 'h-4 w-4',
    },
  };

  return (
    <span className={cn(
      'inline-flex items-center space-x-1 rounded-full',
      categoryInfo.color,
      sizeClasses[size].container
    )}>
      {showIcon && <Icon className={sizeClasses[size].icon} />}
      <span>{categoryInfo.label}</span>
    </span>
  );
};