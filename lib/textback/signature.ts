import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Twilio request signature, per Twilio's webhook security docs: HMAC-SHA1,
 * keyed with the account auth token, over the full public URL followed by every
 * POST parameter as name+value, sorted by name. Base64 encoded.
 */
export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

export function isValidTwilioSignature(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature || !authToken) return false;
  const expected = Buffer.from(computeTwilioSignature(authToken, url, params));
  const given = Buffer.from(signature);
  // timingSafeEqual throws on unequal lengths; unequal is simply invalid.
  return expected.length === given.length && timingSafeEqual(expected, given);
}
