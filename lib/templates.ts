import { apiService } from '@/lib/api';
import type { InvoiceTemplate, InvoiceTemplateId } from '@/types';

/**
 * Bundled copies of the backend catalogue.
 *
 * They keep the picker usable when the templates endpoint is unreachable
 * (cold start, offline, older server) and mirror
 * `invoice.utils.TEMPLATE_META`. Keep both lists in sync.
 */
export const FALLBACK_INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Deep navy header with a bold, structured summary strip.',
    layout: 'hero',
    palette: {
      header_bg: '#0F172A',
      header_text: '#FFFFFF',
      header_soft: '#94A3B8',
      header_eyebrow: '#93C5FD',
      accent: '#2563EB',
      hero_bg: '#EFF6FF',
      hero_text: '#1D4ED8',
      table_head_bg: '#F8FAFC',
      table_head_text: '#64748B',
      table_head_rule: '#2563EB',
      grand_bg: '#0F172A',
      grand_text: '#FFFFFF',
      border: '#E2E8F0',
      surface: '#F8FAFC',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Fresh emerald header for a confident, contemporary look.',
    layout: 'hero',
    palette: {
      header_bg: '#064E3B',
      header_text: '#FFFFFF',
      header_soft: '#A7F3D0',
      header_eyebrow: '#6EE7B7',
      accent: '#047857',
      hero_bg: '#ECFDF5',
      hero_text: '#065F46',
      table_head_bg: '#F0FDF4',
      table_head_text: '#065F46',
      table_head_rule: '#047857',
      grand_bg: '#047857',
      grand_text: '#FFFFFF',
      border: '#D1FAE5',
      surface: '#FFFFFF',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Quiet whitespace with hairline rules and understated type.',
    layout: 'hero',
    palette: {
      header_bg: '#FFFFFF',
      header_text: '#0F172A',
      header_soft: '#64748B',
      header_eyebrow: '#2563EB',
      accent: '#0F172A',
      hero_bg: '#F8FAFC',
      hero_text: '#0F172A',
      table_head_bg: '#FFFFFF',
      table_head_text: '#64748B',
      table_head_rule: '#0F172A',
      grand_bg: '#0F172A',
      grand_text: '#FFFFFF',
      border: '#E2E8F0',
      surface: '#F8FAFC',
    },
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    description: 'Timeless letterhead with a ruled, bordered table.',
    layout: 'letterhead',
    palette: {
      header_bg: '#FFFFFF',
      header_text: '#111827',
      header_soft: '#52525B',
      header_eyebrow: '#52525B',
      accent: '#18181B',
      hero_bg: '#FFFFFF',
      hero_text: '#111827',
      table_head_bg: '#F4F4F5',
      table_head_text: '#111827',
      table_head_rule: '#18181B',
      grand_bg: '#FFFFFF',
      grand_text: '#111827',
      border: '#D4D4D8',
      surface: '#FFFFFF',
    },
  },
];

let cachedTemplates: InvoiceTemplate[] | null = null;

export async function fetchInvoiceTemplates(): Promise<InvoiceTemplate[]> {
  if (cachedTemplates) return cachedTemplates;

  try {
    const response = await apiService.invoices.getTemplates();
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      cachedTemplates = data as InvoiceTemplate[];
      return cachedTemplates;
    }
  } catch {
    // Fall through to the bundled samples so the picker always renders.
  }

  return FALLBACK_INVOICE_TEMPLATES;
}

export function findInvoiceTemplate(
  templates: InvoiceTemplate[],
  id: InvoiceTemplateId | string | null | undefined,
): InvoiceTemplate | undefined {
  if (!id) return undefined;
  return templates.find((template) => template.id === id);
}

export function invoiceTemplateName(
  templates: InvoiceTemplate[],
  id: InvoiceTemplateId | string | null | undefined,
): string {
  return findInvoiceTemplate(templates, id)?.name ?? 'Classic';
}