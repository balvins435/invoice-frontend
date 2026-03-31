'use client';

import { AIInvoiceDraft } from '@/types';

const AI_INVOICE_DRAFT_STORAGE_KEY = 'smartinvoice.aiInvoiceDraft';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeDraft = (value: unknown): AIInvoiceDraft | null => {
  if (!isObject(value)) return null;

  const items = Array.isArray(value.items)
    ? value.items
        .filter(isObject)
        .map((item) => ({
          description: String(item.description || ''),
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
        }))
        .filter((item) => item.description || item.quantity || item.unit_price)
    : [];

  return {
    business_id: typeof value.business_id === 'number' ? value.business_id : undefined,
    client_name: String(value.client_name || ''),
    client_email: String(value.client_email || ''),
    issue_date: String(value.issue_date || ''),
    due_date: String(value.due_date || ''),
    currency: typeof value.currency === 'string' ? value.currency : undefined,
    status: value.status === 'sent' ? 'sent' : 'draft',
    items,
  };
};

export const storeAiInvoiceDraft = (draft: AIInvoiceDraft) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(AI_INVOICE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const consumeAiInvoiceDraft = (): AIInvoiceDraft | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(AI_INVOICE_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  window.sessionStorage.removeItem(AI_INVOICE_DRAFT_STORAGE_KEY);

  try {
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
};
