import { handleTextback } from "@/lib/textback/handler";

/** Twilio webhook (voice). Reads env and per-request headers; never prerender. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleTextback("voice", request);
}
