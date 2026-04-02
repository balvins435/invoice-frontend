'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { apiService } from '@/lib/api';
import {
  AI_CHAT_EVENTS,
  openAiChatShortcut,
  readAiChatState,
  storeAiInvoiceDraft,
  writeAiChatState,
} from '@/lib/ai';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { AIAssistantMode, AIAssistantResponse, AIChatMessage, AIReportMetric } from '@/types';

const QUICK_PROMPTS: Array<{ label: string; mode: AIAssistantMode; prompt: string }> = [
  {
    label: 'Draft invoice',
    mode: 'invoice',
    prompt: 'Create an invoice for brand design worth KES 65,000 due in 14 days for Mercy Wanjiru.',
  },
  {
    label: 'Summarize month',
    mode: 'report',
    prompt: 'Give me a simple summary of this month’s income, expenses, tax exposure, and the top actions to take next.',
  },
  {
    label: 'Follow up overdue',
    mode: 'general',
    prompt: 'Which unpaid invoices should I follow up first and what should I do next for each one?',
  },
];

const MODE_OPTIONS: Array<{ value: AIAssistantMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'report', label: 'Report' },
  { value: 'general', label: 'Ops' },
];

const toneClassMap: Record<string, string> = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
  negative: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; detail?: string } } }).response;
    return response?.data?.error || response?.data?.detail || fallback;
  }
  return fallback;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_MESSAGES: AIChatMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    type: 'text',
    content:
      'Ask me to draft an invoice, explain this month’s numbers, or suggest the next finance action for the active business.',
  },
];

const ReportMetricPill = ({ metric }: { metric: AIReportMetric }) => {
  const toneClass = toneClassMap[metric.tone] || toneClassMap.neutral;
  return (
    <div className={`rounded-2xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{metric.label}</p>
      <p className="mt-1 text-sm font-semibold">{metric.value}</p>
    </div>
  );
};

const AssistantResponseCard = ({
  response,
  onUseInvoiceDraft,
  onUsePrompt,
}: {
  response: AIAssistantResponse;
  onUseInvoiceDraft: () => void;
  onUsePrompt: (prompt: string) => void;
}) => (
  <div className="space-y-3 rounded-3xl rounded-tl-md border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
      <Sparkles className="h-3.5 w-3.5" />
      SmartInvoice AI
    </div>

    {response.reply ? (
      <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{response.reply}</p>
    ) : null}

    {response.report_summary ? (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {response.report_summary.period_label}
        </p>
        {response.report_summary.headline ? (
          <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            {response.report_summary.headline}
          </p>
        ) : null}

        {response.report_summary.metrics.length ? (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {response.report_summary.metrics.map((metric, index) => (
              <ReportMetricPill key={`${metric.label}-${index}`} metric={metric} />
            ))}
          </div>
        ) : null}

        {response.report_summary.insights.length ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Insights
            </p>
            <div className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {response.report_summary.insights.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </div>
        ) : null}

        {response.report_summary.actions.length ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Recommended Actions
            </p>
            <div className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {response.report_summary.actions.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    ) : null}

    {response.invoice_draft ? (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Invoice Draft Ready
        </p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {response.invoice_draft.client_name || 'Unnamed client'} · {response.invoice_draft.items.length} item
          {response.invoice_draft.items.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={onUseInvoiceDraft}
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Open in invoice builder
        </button>
      </div>
    ) : null}

    {response.suggested_prompts.length ? (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Try next
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {response.suggested_prompts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onUsePrompt(item)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

export function AIChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIAssistantMode>('auto');
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>(DEFAULT_MESSAGES);
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    hasBusinesses,
    requiresSelection,
  } = useActiveBusiness();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isSubmitting]);

  useEffect(() => {
    const savedState = readAiChatState();
    if (savedState) {
      setIsOpen(savedState.isOpen);
      setMode(savedState.mode);
      setPrompt(savedState.prompt);
      setMessages(savedState.messages.length ? savedState.messages : DEFAULT_MESSAGES);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeAiChatState({
      isOpen,
      mode,
      prompt,
      messages,
    });
  }, [isHydrated, isOpen, messages, mode, prompt]);

  useEffect(() => {
    router.prefetch(ROUTES.createInvoice);
    router.prefetch(ROUTES.assistant);
  }, [router]);

  const submitPrompt = useCallback(async (nextPrompt?: string, nextMode?: AIAssistantMode) => {
    const promptToSend = (nextPrompt ?? prompt).trim();
    const modeToSend = nextMode ?? mode;

    if (!promptToSend) {
      toast.error('Enter a prompt for the assistant.');
      return;
    }

    if (!hasBusinesses && modeToSend === 'report') {
      toast.error('Create a business first to generate financial summaries.');
      return;
    }

    if (!activeBusinessId && modeToSend === 'report') {
      toast.error('Select a business first to generate a report.');
      return;
    }

    const userMessage: AIChatMessage = {
      id: createId(),
      role: 'user',
      type: 'text',
      content: promptToSend,
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt('');
    setIsSubmitting(true);

    try {
      const aiResponse = await apiService.ai.askAssistant({
        prompt: promptToSend,
        mode: modeToSend,
        ...(activeBusinessId ? { business_id: activeBusinessId } : {}),
      });

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          type: 'response',
          content: aiResponse.data,
        },
      ]);
      setMode(modeToSend);
      setIsOpen(true);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to reach the AI assistant.');
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          type: 'text',
          content: message,
        },
      ]);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeBusinessId, hasBusinesses, mode, prompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleShortcut = (event: Event) => {
      const customEvent = event as CustomEvent<{
        prompt?: string;
        mode?: AIAssistantMode;
        autoSubmit?: boolean;
        open?: boolean;
      }>;
      const detail = customEvent.detail;
      if (!detail?.prompt) return;

      const shortcutMode = detail.mode ?? 'auto';
      setPrompt(detail.prompt);
      setMode(shortcutMode);
      setIsOpen(detail.open ?? true);

      if (detail.autoSubmit) {
        void submitPrompt(detail.prompt, shortcutMode);
      }
    };

    window.addEventListener(AI_CHAT_EVENTS.shortcut, handleShortcut as EventListener);
    return () => {
      window.removeEventListener(AI_CHAT_EVENTS.shortcut, handleShortcut as EventListener);
    };
  }, [submitPrompt]);

  const businessName = useMemo(
    () => activeBusiness?.display_name || activeBusiness?.business_name || null,
    [activeBusiness]
  );

  if (pathname === ROUTES.assistant) {
    return null;
  }

  const handleUseInvoiceDraft = (response: AIAssistantResponse) => {
    if (!response.invoice_draft) return;

    storeAiInvoiceDraft({
      ...response.invoice_draft,
      business_id: activeBusinessId || response.invoice_draft.business_id,
    });
    toast.success('Invoice draft moved into the invoice builder.');
    setIsOpen(false);
    router.push(ROUTES.createInvoice);
  };

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 w-full px-4 pb-4 sm:w-auto sm:px-6 sm:pb-6 lg:right-0 lg:mr-0 lg:pl-0 lg:pr-6">
      <div className="pointer-events-auto ml-auto w-full sm:max-w-[24rem]">
        {isOpen ? (
          <div className="flex max-h-[min(78dvh,calc(100dvh-1rem))] min-h-[24rem] w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur sm:max-h-[min(72dvh,44rem)] sm:min-h-[28rem] sm:max-w-[24rem] lg:mr-0 dark:border-slate-700 dark:bg-slate-900/95">
            <div className="shrink-0 border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98)_0%,_rgba(255,255,255,0.98)_100%)] p-4 dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(180deg,_rgba(15,23,42,0.98)_0%,_rgba(2,6,23,0.98)_100%)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Shortcut
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">SmartInvoice Copilot</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {businessName ? `Working inside ${businessName}` : 'Prompt the assistant from anywhere in the dashboard.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.assistant}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Open full assistant"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Close AI assistant"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {businesses.length > 1 ? (
                <div className="mt-4">
                  <ActiveBusinessSelector
                    businesses={businesses}
                    activeBusinessId={activeBusinessId}
                    onChange={setActiveBusinessId}
                    helperText="The selected business will be used for reports and draft ownership."
                  />
                </div>
              ) : null}
            </div>

            <div
              ref={scrollRef}
              className="ai-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 touch-pan-y"
            >
              {requiresSelection ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  Choose a business above to get business-aware summaries and invoice drafts under the right company.
                </div>
              ) : null}

              {messages.map((message) =>
                message.type === 'text' ? (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <AssistantResponseCard
                    key={message.id}
                    response={message.content}
                    onUseInvoiceDraft={() => handleUseInvoiceDraft(message.content)}
                    onUsePrompt={(nextPrompt) => openAiChatShortcut({ prompt: nextPrompt, mode: 'auto', autoSubmit: true, open: true })}
                  />
                )
              )}

              {isSubmitting ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-3xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-950/80">
              <div className="mb-3 flex flex-wrap gap-2">
                {MODE_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      mode === item.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                      setMode(item.mode);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask for an invoice draft, report summary, or next action..."
                  className="min-h-[80px] flex-1 resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submitPrompt()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  aria-label="Send prompt"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Bot className="h-5 w-5" />
              </span>
              <span className="hidden sm:block">
                Ask SmartInvoice AI
                <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Draft invoices, explain numbers, suggest next actions
                </span>
              </span>
              <span className="sm:hidden">
                <MessageSquare className="h-4 w-4" />
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 transition group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 sm:block" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
