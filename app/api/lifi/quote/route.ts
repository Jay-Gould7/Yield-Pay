import { NextRequest, NextResponse } from "next/server";

const LI_FI_QUOTE_URL = "https://li.quest/v1/quote";

export async function GET(request: NextRequest) {
  const url = new URL(LI_FI_QUOTE_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {};

  if (process.env.LIFI_API_KEY) {
    headers["x-lifi-api-key"] = process.env.LIFI_API_KEY;
  }

  const response = await fetch(url, {
    headers,
    method: "GET",
    next: { revalidate: 0 },
  });

  const body = await response.text();

  return new NextResponse(body, {
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
    status: response.status,
  });
}
