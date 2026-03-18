const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

const canUseStorage = (): boolean => typeof window !== 'undefined';

const safeGet = (key: string): string | null => {
  if (!canUseStorage()) return null;
  return localStorage.getItem(key);
};

const safeSet = (key: string, value: string): void => {
  if (!canUseStorage()) return;
  localStorage.setItem(key, value);
};

const safeRemove = (key: string): void => {
  if (!canUseStorage()) return;
  localStorage.removeItem(key);
};

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const session = {
  get accessToken(): string | null {
    return safeGet(ACCESS_TOKEN_KEY);
  },
  get refreshToken(): string | null {
    return safeGet(REFRESH_TOKEN_KEY);
  },
  get rawUser(): string | null {
    return safeGet(USER_KEY);
  },
  setTokens(access: string, refresh: string): void {
    safeSet(ACCESS_TOKEN_KEY, access);
    safeSet(REFRESH_TOKEN_KEY, refresh);
  },
  setAccessToken(access: string): void {
    safeSet(ACCESS_TOKEN_KEY, access);
  },
  setRawUser(user: string): void {
    safeSet(USER_KEY, user);
  },
  clear(): void {
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
    safeRemove(USER_KEY);
  },
  isAccessTokenExpired(bufferSeconds = 30): boolean {
    const token = safeGet(ACCESS_TOKEN_KEY);
    if (!token) return true;
    const payload = parseJwtPayload(token);
    const exp = payload?.exp;
    if (typeof exp !== 'number') return false;
    const now = Math.floor(Date.now() / 1000);
    return exp <= now + bufferSeconds;
  },
};

