'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Building,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight
} from 'lucide-react';
import { authService } from '@/lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Business', href: '/business', icon: Building },
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const user = authService.getUser();
  const userName =
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User';
  const userEmail = user?.email || 'No email';

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow-md border border-gray-200"
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
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-600">InvoiceTracker</h1>
              <p className="text-xs text-gray-500">Smart Business Management</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-sm text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="space-y-2">
            <Link
              href="/dashboard/settings"
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
