import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Spinner } from './Spinner';

type StateProps = { title?: string; description?: string; actionLabel?: string; onAction?: () => void; action?: React.ReactNode; className?: string };

export function LoadingState({ title = 'Loading', description, className }: StateProps) {
  return <div role="status" aria-live="polite" className={cn('flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center', className)}><Spinner size="lg" /><p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>{description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}</div>;
}

export function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction, action, className }: StateProps) {
  return <div className={cn('flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center', className)}><Inbox aria-hidden="true" className="h-8 w-8 text-slate-400" /><p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>{description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}{action || (actionLabel && onAction ? <Button variant="secondary" onClick={onAction}>{actionLabel}</Button> : null)}</div>;
}

export function ErrorState({ title = 'Something went wrong', description, actionLabel = 'Try again', onAction, className }: StateProps) {
  return <div role="alert" className={cn('flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center', className)}><AlertTriangle aria-hidden="true" className="h-8 w-8 text-red-500" /><p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>{description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}{onAction ? <Button variant="secondary" onClick={onAction}><RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />{actionLabel}</Button> : null}</div>;
}
