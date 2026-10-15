import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Retell's webhook signature, reimplemented with node:crypto so the site does
 * not take on the retell-sdk dependency for twelve lines (BUILD_NOTES.md).
 *
 * Header `X-Retell-Signature: v=<ms timestamp>,d=<hex>` where
 * hex = HMAC-SHA256(key = Retell API key, message = raw body + timestamp).
 * Same algorithm as retell-sdk 6.2.7 `src/lib/webhook_auth.ts`; a signature
 * more than five minutes from now is rejected, so a captured request can't be
 * replayed later.
 */
export const SIGNATURE_HEADER = "x-retell-signature";
const MAX_SKEW_MS = 5 * 60 * 1000;

const digest = (body: string, timestamp: string, apiKey: string) =>
  createHmac("sha256", apiKey).update(body + timestamp).digest("hex");

export function signRetell(body: string, apiKey: string, nowMs: number = Date.now()): string {
  return `v=${nowMs},d=${digest(body, String(nowMs), apiKey)}`;
}

export function verifyRetell(
  body: string,
  header: string | null,
  apiKey: string,
  nowMs: number = Date.now(),
): boolean {
  if (!header || !apiKey) return false;
  const match = /^v=(\d+),d=([0-9a-f]+)$/i.exec(header.trim());
  if (!match) return false;
  const [, timestamp, given] = match as unknown as [string, string, string];
  if (Math.abs(nowMs - Number(timestamp)) > MAX_SKEW_MS) return false;
  const expected = Buffer.from(digest(body, timestamp, apiKey), "hex");
  const actual = Buffer.from(given, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
