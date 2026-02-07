import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const variants = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-success-50 text-success-800 border-success-200',
  warning: 'bg-warning-50 text-warning-800 border-warning-200',
  error: 'bg-danger-50 text-danger-800 border-danger-200',
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, dismissible, onDismiss, ...props }, ref) => {
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
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
            {title && (
              <h4 className="font-medium mb-1">{title}</h4>
            )}
            <div className="text-sm">{children}</div>
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };