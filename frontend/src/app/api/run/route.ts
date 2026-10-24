import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const API = process.env.LOKA_API_URL ?? "http://127.0.0.1:8000";

/** Long-timeout proxy — Next rewrites die around ~30s; full train needs longer. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const upstream = await fetch(`${API}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      // Node 20+
      signal: AbortSignal.timeout(280_000),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upstream train failed";
    return NextResponse.json(
      {
        error: message,
        hint: "Is FastAPI running on :8000? Full runs can take 1–2 minutes.",
      },
      { status: 502 }
    );
  }
}
