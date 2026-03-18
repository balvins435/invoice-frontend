'use client';

import React from 'react';

import { RouteGuard } from '@/components/auth/RouteGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteGuard mode="guest">{children}</RouteGuard>;
}

