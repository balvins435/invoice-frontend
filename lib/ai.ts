'use client';

import { AIAssistantMode, AIChatMessage, AIInvoiceDraft } from '@/types';

const AI_INVOICE_DRAFT_STORAGE_KEY = 'smartinvoice.aiInvoiceDraft';
const AI_CHAT_STATE_STORAGE_KEY = 'smartinvoice.aiChatState';
const AI_CHAT_SHORTCUT_EVENT = 'smartinvoice:ai-chat-shortcut';
const AI_CHAT_STATE_EVENT = 'smartinvoice:ai-chat-state-changed';

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

export interface AIChatShortcutPayload {
  prompt: string;
  mode?: AIAssistantMode;
  autoSubmit?: boolean;
  open?: boolean;
}

export interface AIChatState {
  isOpen: boolean;
  mode: AIAssistantMode;
  prompt: string;
  messages: AIChatMessage[];
}

const normalizeChatMessage = (value: unknown): AIChatMessage | null => {
  if (!isObject(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  const role = value.role === 'assistant' || value.role === 'user' ? value.role : null;
  const type = value.type === 'text' || value.type === 'response' ? value.type : null;
  if (!id || !role || !type) return null;

  if (type === 'text') {
    return {
      id,
      role,
      type,
      content: String(value.content || ''),
    };
  }

  if (!isObject(value.content)) return null;
  return {
    id,
    role: 'assistant',
    type,
    content: {
      intent: String(value.content.intent || 'general'),
      reply: String(value.content.reply || ''),
      invoice_draft: normalizeDraft(value.content.invoice_draft),
      report_summary: isObject(value.content.report_summary)
        ? {
            period_label: String(value.content.report_summary.period_label || ''),
            headline: String(value.content.report_summary.headline || ''),
            metrics: Array.isArray(value.content.report_summary.metrics)
              ? value.content.report_summary.metrics
                  .filter(isObject)
                  .map((metric) => ({
                    label: String(metric.label || ''),
                    value: String(metric.value || ''),
                    tone: String(metric.tone || 'neutral'),
                  }))
              : [],
            insights: Array.isArray(value.content.report_summary.insights)
              ? value.content.report_summary.insights.map((item) => String(item)).filter(Boolean)
              : [],
            actions: Array.isArray(value.content.report_summary.actions)
              ? value.content.report_summary.actions.map((item) => String(item)).filter(Boolean)
              : [],
          }
        : null,
      suggested_prompts: Array.isArray(value.content.suggested_prompts)
        ? value.content.suggested_prompts.map((item) => String(item)).filter(Boolean)
        : [],
    },
  };
};

const normalizeChatState = (value: unknown): AIChatState | null => {
  if (!isObject(value)) return null;
  const mode = value.mode === 'invoice' || value.mode === 'report' || value.mode === 'general' || value.mode === 'auto'
    ? value.mode
    : 'auto';
  const messages = Array.isArray(value.messages)
    ? value.messages.map(normalizeChatMessage).filter((item): item is AIChatMessage => item !== null)
    : [];

  return {
    isOpen: Boolean(value.isOpen),
    mode,
    prompt: String(value.prompt || ''),
    messages,
  };
};

export const readAiChatState = (): AIChatState | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(AI_CHAT_STATE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeChatState(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const writeAiChatState = (state: AIChatState) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(AI_CHAT_STATE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(AI_CHAT_STATE_EVENT, { detail: state }));
};

export const clearAiChatState = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(AI_CHAT_STATE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AI_CHAT_STATE_EVENT, { detail: null }));
};

export const openAiChatShortcut = (payload: AIChatShortcutPayload) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AI_CHAT_SHORTCUT_EVENT, { detail: payload }));
};

export const AI_CHAT_EVENTS = {
  shortcut: AI_CHAT_SHORTCUT_EVENT,
  stateChanged: AI_CHAT_STATE_EVENT,
} as const;
