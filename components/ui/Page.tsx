import React from 'react';
import { cn } from '@/lib/utils';

export interface PageProps extends React.PropsWithChildren<React.HTMLAttributes<HTMLElement>> {
  contentClassName?: string;
}

export function Page({ children, className, contentClassName, ...props }: PageProps) {
  return <main className={cn('min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8', className)} {...props}><div className={cn('mx-auto w-full max-w-7xl space-y-6', contentClassName)}>{children}</div></main>;
}

export interface PageHeaderProps { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode; className?: string }

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return <header className={cn('flex flex-col justify-between gap-4 lg:flex-row lg:items-end', className)}><div className="min-w-0">{eyebrow ? <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-500">{eyebrow}</p> : null}<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h1>{description ? <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">{description}</p> : null}</div>{actions ? <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">{actions}</div> : null}</header>;
}

export function SectionHeader({ title, description, actions, action }: { title: string; description?: string; actions?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}</div>{actions || action}</div>;
}

export function Skeleton({ className }: { className?: string }) { return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800', className)} />; }
