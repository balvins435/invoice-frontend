'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { ActiveBusinessSelector } from '@/components/business/ActiveBusinessSelector';
import { Navbar } from '@/components/Navbar';
import { apiService } from '@/lib/api';
import { storeAiInvoiceDraft } from '@/lib/ai';
import { useActiveBusiness } from '@/lib/hooks/useActiveBusiness';
import { ROUTES } from '@/lib/routes';
import { AIAssistantMode, AIAssistantResponse, AIReportMetric } from '@/types';

const QUICK_PROMPTS: Array<{ label: string; mode: AIAssistantMode; prompt: string }> = [
  {
    label: 'Draft an invoice',
    mode: 'invoice',
    prompt: 'Create an invoice for website design worth KES 85,000 due in 14 days for James Otieno.',
  },
  {
    label: 'Summarize this month',
    mode: 'report',
    prompt: 'Give me a simple summary of this month’s income, expenses, tax exposure, and the top follow-up actions.',
  },
  {
    label: 'Cash flow follow-up',
    mode: 'general',
    prompt: 'Which unpaid invoices should I follow up first and what is the clearest next action for each?',
  },
];

const modeMeta: Record<AIAssistantMode, { label: string; description: string }> = {
  auto: { label: 'Auto', description: 'Let the assistant decide whether this is an invoice, report, or workflow request.' },
  invoice: { label: 'Invoice Draft', description: 'Turn plain language into an invoice draft you can send to the builder.' },
  report: { label: 'Financial Report', description: 'Explain business performance using your real numbers and trends.' },
  general: { label: 'Operations Help', description: 'Ask for follow-ups, reminders, and workflow guidance across the system.' },
};

const toneClassMap: Record<string, string> = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
  negative: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const BusinessStateCard = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Building2 className="h-6 w-6 text-slate-500 dark:text-slate-300" />
    </div>
    <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </section>
);

const ReportMetricPill = ({ metric }: { metric: AIReportMetric }) => {
  const toneClass = toneClassMap[metric.tone] || toneClassMap.neutral;
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">{metric.label}</p>
      <p className="mt-1 text-lg font-semibold">{metric.value}</p>
    </div>
  );
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; detail?: string } } }).response;
    return response?.data?.error || response?.data?.detail || fallback;
  }
  return fallback;
};

export default function AIAssistantPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AIAssistantMode>('auto');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIAssistantResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    hasBusinesses,
    requiresSelection,
    isLoading: isBusinessLoading,
    error: businessError,
  } = useActiveBusiness();

  const businessName = activeBusiness?.display_name || activeBusiness?.business_name;
  const showBusinessSelector = businesses.length > 1;

  useEffect(() => {
    router.prefetch(ROUTES.createInvoice);
  }, [router]);

  useEffect(() => {
    if (businessError) {
      toast.error('Failed to load businesses');
    }
  }, [businessError]);

  const submitPrompt = async (nextPrompt?: string, nextMode?: AIAssistantMode) => {
    const promptToSend = (nextPrompt ?? prompt).trim();
    const modeToSend = nextMode ?? mode;

    if (!promptToSend) {
      toast.error('Enter a prompt for the assistant.');
      return;
    }

    if (!activeBusinessId && modeToSend === 'report') {
      toast.error('Select a business first to generate a financial report.');
      return;
    }

    try {
      setIsSubmitting(true);
      const aiResponse = await apiService.ai.askAssistant({
        prompt: promptToSend,
        mode: modeToSend,
        ...(activeBusinessId ? { business_id: activeBusinessId } : {}),
      });
      setPrompt(promptToSend);
      setMode(modeToSend);
      setResponse(aiResponse.data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to reach the AI assistant.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseInvoiceDraft = () => {
    if (!response?.invoice_draft) return;
    storeAiInvoiceDraft({
      ...response.invoice_draft,
      business_id: activeBusinessId || response.invoice_draft.business_id,
    });
    toast.success('Invoice draft moved into the invoice builder.');
    router.push(ROUTES.createInvoice);
  };

  return (
    <>
      <Navbar title="AI Copilot" subtitle="Generate invoice drafts and understand business performance with prompts" />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-100 via-cyan-50 to-emerald-100 opacity-70 dark:from-sky-950/50 dark:via-cyan-950/30 dark:to-emerald-950/40" />
              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Smart Assistant
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Prompt your finance workflow like a teammate.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    Use natural language to draft invoices, explain reports, and surface next actions across payments, tax, and customer follow-up.
                  </p>
                  {businessName ? (
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Working inside <span className="text-slate-900 dark:text-white">{businessName}</span>
                    </p>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
                  {showBusinessSelector ? (
                    <ActiveBusinessSelector
                      businesses={businesses}
                      activeBusinessId={activeBusinessId}
                      onChange={setActiveBusinessId}
                      helperText="The assistant uses the selected company for financial context and draft ownership."
                      className="w-full xl:w-[340px]"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {!hasBusinesses && !isBusinessLoading ? (
            <BusinessStateCard
              title="Create a business first"
              description="The assistant becomes far more useful when it knows which company it is helping. Add a business profile first so it can draft invoices and explain real financial performance."
              action={
                <Link
                  href={ROUTES.business}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Go to Business Profile
                </Link>
              }
            />
          ) : requiresSelection ? (
            <BusinessStateCard
              title="Select a business to continue"
              description="You have more than one business. Pick the active company first so invoice drafts and financial insights stay scoped to the right ledger."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compose a prompt</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ask for an invoice draft, a report summary, or a workflow recommendation.</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(Object.keys(modeMeta) as AIAssistantMode[]).map((modeKey) => (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => setMode(modeKey)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        mode === modeKey
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <p className="text-sm font-semibold">{modeMeta[modeKey].label}</p>
                      <p className={`mt-1 text-xs ${mode === modeKey ? 'text-slate-200 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                        {modeMeta[modeKey].description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Example: Create an invoice for Sarah Wanjiku for three bookkeeping sessions at KES 12,000 each, due in 21 days."
                    className="min-h-[180px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPrompt(item.prompt);
                        setMode(item.mode);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitPrompt()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isSubmitting ? 'Thinking…' : 'Run Assistant'}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Best results come from naming the client, amount, service, and due date.
                  </p>
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assistant Output</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Clear guidance, structured drafts, and suggested next prompts.</p>
                    </div>
                  </div>

                  {!response ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                      <Lightbulb className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">No response yet</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Start with a quick prompt or write your own request to the assistant.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          {response.intent}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                          {response.reply}
                        </p>
                      </div>

                      {response.report_summary ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                            <BrainCircuit className="h-4 w-4" />
                            {response.report_summary.period_label || 'Financial summary'}
                          </div>
                          {response.report_summary.headline ? (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{response.report_summary.headline}</p>
                          ) : null}
                          {response.report_summary.metrics.length ? (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {response.report_summary.metrics.map((metric) => (
                                <ReportMetricPill key={`${metric.label}-${metric.value}`} metric={metric} />
                              ))}
                            </div>
                          ) : null}
                          {response.report_summary.insights.length ? (
                            <div className="mt-4 space-y-2">
                              {response.report_summary.insights.map((insight) => (
                                <div key={insight} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                  {insight}
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {response.report_summary.actions.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {response.report_summary.actions.map((action) => (
                                <span key={action} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                  {action}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {response.invoice_draft ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                <FileText className="h-4 w-4" />
                                Invoice draft
                              </div>
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {response.invoice_draft.client_name || 'Unnamed client'}{response.invoice_draft.client_email ? ` • ${response.invoice_draft.client_email}` : ''}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Issue {response.invoice_draft.issue_date} • Due {response.invoice_draft.due_date}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleUseInvoiceDraft}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                            >
                              Open in Builder
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {response.invoice_draft.items.map((item, index) => (
                              <div key={`${item.description}-${index}`} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.description || `Item ${index + 1}`}</p>
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Qty {item.quantity} • KES {Number(item.unit_price || 0).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  KES {Number((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {response.suggested_prompts.length ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Suggested follow-ups</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {response.suggested_prompts.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => submitPrompt(suggestion, 'auto')}
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
