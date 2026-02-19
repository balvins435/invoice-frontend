const DEFAULT_LOCAL_API_URL = 'http://localhost:8000/api';
const DEFAULT_PROD_API_URL = 'https://invoice-backend-8feg.onrender.com/api';

const sanitizeApiUrl = (url: string): string => {
  const cleaned = (url || '').trim().replace(/\/+$/, '');
  return cleaned || DEFAULT_LOCAL_API_URL;
};

export const API_URL = sanitizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : DEFAULT_LOCAL_API_URL)
);

export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');
