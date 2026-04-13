import { NextRequest, NextResponse } from "next/server";

const LI_FI_EARN_VAULTS_URL = "https://earn.li.fi/v1/earn/vaults";
const CACHE_TTL_MS = 30_000;

type CachedResponse = {
  body: string;
  contentType: string;
  status: number;
  storedAt: number;
};

const responseCache = new Map<string, CachedResponse>();

export async function GET(request: NextRequest) {
  const url = new URL(LI_FI_EARN_VAULTS_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  const cacheKey = url.toString();
  const cached = responseCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.storedAt < CACHE_TTL_MS) {
    return new NextResponse(cached.body, {
      headers: {
        "content-type": cached.contentType,
        "x-yieldpay-cache": "hit",
      },
      status: cached.status,
    });
  }

  const response = await fetch(url, {
    method: "GET",
    next: { revalidate: 0 },
  });

  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  if (response.status !== 429) {
    responseCache.set(cacheKey, {
      body,
      contentType,
      status: response.status,
      storedAt: now,
    });
  } else if (cached) {
    // Upstream rate-limited: serve the most recent successful snapshot for resilience.
    return new NextResponse(cached.body, {
      headers: {
        "content-type": cached.contentType,
        "x-yieldpay-cache": "stale",
      },
      status: cached.status,
    });
  }

  return new NextResponse(body, {
    headers: {
      "content-type": contentType,
      "x-yieldpay-cache": "miss",
    },
    status: response.status,
  });
}
