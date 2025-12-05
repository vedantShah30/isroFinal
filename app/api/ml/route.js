import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const ML_MODEL_URL = process.env.ML_MODEL_URL;
    if (!ML_MODEL_URL) {
      return NextResponse.json({ error: 'ML_MODEL_URL not configured' }, { status: 500 });
    }

    const payload = await request.json();
    const url = `${ML_MODEL_URL}/infer`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return NextResponse.json({ error: 'Upstream error', details: data }, { status: resp.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
