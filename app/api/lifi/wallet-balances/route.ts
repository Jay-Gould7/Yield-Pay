import { NextRequest, NextResponse } from "next/server";

const LI_FI_WALLET_BASE = "https://li.quest/v1";
const REQUEST_TIMEOUT_MS = 10_000;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address query param." }, { status: 400 });
  }

  const url = new URL(`${LI_FI_WALLET_BASE}/wallets/${address}/balances`);
  url.searchParams.set("extended", "true");

  const headers: HeadersInit = {};

  if (process.env.LIFI_API_KEY) {
    headers["x-lifi-api-key"] = process.env.LIFI_API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      method: "GET",
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    const body = await response.text();

    return new NextResponse(body, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
      status: response.status,
    });
  } catch (error) {
    const isAbort =
      error instanceof Error && (error.name === "AbortError" || error.message.includes("aborted"));

    return NextResponse.json(
      {
        error: isAbort
          ? "Wallet balances request timed out."
          : "Failed to fetch wallet balances.",
      },
      { status: isAbort ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
