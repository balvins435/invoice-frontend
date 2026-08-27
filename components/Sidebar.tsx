'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Sparkles,
  Building,
  MessageCircle,
  Landmark,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { useTheme } from '@/lib/theme';
import { Spinner } from '@/components/ui/Spinner';

const navigation = [
  { name: 'Dashboard', href: ROUTES.dashboard, icon: Home },
  { name: 'Business', href: ROUTES.business, icon: Building },
  { name: 'Invoices', href: ROUTES.invoices, icon: FileText },
  { name: 'Payments', href: ROUTES.payments, icon: Landmark },
  { name: 'Messaging', href: ROUTES.messaging, icon: MessageCircle },
  { name: 'Tax', href: ROUTES.tax, icon: ShieldCheck },
  { name: 'Expenses', href: ROUTES.expenses, icon: CreditCard },
  { name: 'AI Copilot', href: ROUTES.assistant, icon: Sparkles },
  { name: 'Reports', href: ROUTES.reports, icon: BarChart3 },
  
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    navigation.forEach((item) => router.prefetch(item.href));
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await authService.logout({ redirectTo: ROUTES.login });
  };

  const user = authService.getUser();
  const userName = user?.full_name?.trim() || 'User';
  const userEmail = user?.email || 'No email';

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className={`lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 transition-opacity ${
          isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 flex h-full w-64 flex-col bg-white border-r border-gray-200 z-40 dark:bg-slate-900 dark:border-slate-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center dark:bg-white">
              <FileText className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">InvoiceTracker</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Smart Business Management</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-800">
              <User className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{userName}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const showPendingSpinner = pendingRoute === item.href && pathname !== item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setPendingRoute(item.href);
                      setIsOpen(false);
                    }}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {showPendingSpinner ? (
                      <Spinner size="sm" />
                    ) : (
                      isActive && <ChevronRight className="h-4 w-4" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="flex items-center">
                {theme === 'dark' ? (
                  <Moon className="mr-3 h-5 w-5" />
                ) : (
                  <Sun className="mr-3 h-5 w-5" />
                )}
                Theme
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
            <Link
              href={ROUTES.settings}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isLoggingOut ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-3">Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
