import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

const positiveInteger = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function GET(request: NextRequest) {
  const businessId = positiveInteger(request.nextUrl.searchParams.get('business_id'));
  const year = positiveInteger(request.nextUrl.searchParams.get('year'));
  const monthValue = request.nextUrl.searchParams.get('month');
  const month = monthValue ? positiveInteger(monthValue) : null;

  if (!businessId || !year || year < 2000 || year > 2100 || (monthValue && (!month || month > 12))) {
    return NextResponse.json({ detail: 'Invalid report parameters.' }, { status: 400 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ detail: 'Authentication credentials were not provided.' }, { status: 401 });
  }

  const params = new URLSearchParams({ business_id: String(businessId), year: String(year) });
  if (month) params.set('month', String(month));

  try {
    const response = await fetch(`${API_URL}/reports/pdf/?${params}`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { detail: detail || 'The report service could not generate the PDF.' },
        { status: response.status }
      );
    }

    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ detail: 'The report service is unavailable.' }, { status: 502 });
  }
}
