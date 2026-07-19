import { NextResponse } from 'next/server';

export async function POST() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
  const apiKey     = process.env.BOT_API_KEY ?? '';

  if (!apiKey) {
    return NextResponse.json({ error: 'BOT_API_KEY not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/admin/trigger-scan`, {
      method:  'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 502 });
  }
}
