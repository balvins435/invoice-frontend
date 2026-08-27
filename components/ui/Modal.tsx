import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  description?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  description,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      const previouslyFocused = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => dialogRef.current?.focus());
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        previouslyFocused?.focus();
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={cn(
            'relative w-full rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{description ? <p id="modal-description" className="sr-only">{description}</p> : null}{children}</div>
        </div>
      </div>
    </div>
  );
};

export { Modal };
