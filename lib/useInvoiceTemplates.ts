'use client';

import { useEffect, useState } from 'react';
import type { InvoiceTemplate } from '@/types';
import { FALLBACK_INVOICE_TEMPLATES, fetchInvoiceTemplates } from '@/lib/templates';

/**
 * Load the invoice-template catalogue once per page. The bundled samples are
 * shown immediately and replaced as soon as the API answers.
 */
export function useInvoiceTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>(FALLBACK_INVOICE_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchInvoiceTemplates().then((result) => {
      if (!active) return;
      setTemplates(result);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { templates, isLoading };
}