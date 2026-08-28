import React from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const variants = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200',
  warning: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200',
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn('font-medium mb-1', className)}
    {...props}
  />
));

AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, dismissible, onDismiss, ...props }, ref) => {
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        role={variant === 'error' ? 'alert' : 'status'}
        aria-live={variant === 'error' ? 'assertive' : 'polite'}
        className={cn(
          'rounded-lg border p-4',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start">
          <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            {title ? (
              <>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{children}</AlertDescription>
              </>
            ) : (
              children
            )}
          </div>
          {dismissible && (
            <button
                type="button"
                aria-label="Dismiss notification"
              onClick={onDismiss}
              className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-md opacity-70 hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert, AlertDescription, AlertTitle };
