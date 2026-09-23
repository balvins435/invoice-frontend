import { session } from '@/lib/session';

export interface ReportPdfParams {
  business_id: number;
  year: number;
  month?: number;
}

export async function downloadReportPdf(params: ReportPdfParams): Promise<Blob> {
  const token = session.accessToken;
  if (!token) throw new Error('Authentication required');

  const query = new URLSearchParams({
    business_id: String(params.business_id),
    year: String(params.year),
  });
  if (params.month) query.set('month', String(params.month));

  const response = await fetch(`/api/reports/download?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Failed to download report');
  return response.blob();
}
