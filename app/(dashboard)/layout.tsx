'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { AIChatWidget } from '@/components/ai/AIChatWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard mode="protected">
      <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-slate-950">
        <Sidebar />
        <div className="pt-16 lg:ml-64 lg:pt-0">
          {children}
        </div>
        <AIChatWidget />
      </div>
    </RouteGuard>
  );
}
