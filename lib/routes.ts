export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  business: '/business',
  invoices: '/invoices',
  createInvoice: '/invoices/create',
  expenses: '/expenses',
  createExpense: '/expenses/create',
  payments: '/payments',
  messaging: '/messaging',
  tax: '/tax',
  assistant: '/assistant',
  reports: '/reports',
  settings: '/settings',
} as const;

export const AUTH_ROUTE_SET = new Set<string>([
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
  ROUTES.onboarding,
]);

export const isInternalRoute = (value: string): boolean => (
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('://')
);

export const sanitizeNextRoute = (
  next: string | null | undefined,
  fallback = ROUTES.dashboard
): string => {
  if (!next || !isInternalRoute(next)) return fallback;
  if (AUTH_ROUTE_SET.has(next)) return fallback;
  return next;
};
