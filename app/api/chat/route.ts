import { handleChat } from "@/lib/chat/handler";

/**
 * Site chat endpoint. The logic is in lib/chat/handler.ts, where tests can
 * call it with their own env and fetch; CHATBOT_SPEC.md says what it does.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleChat(request, { env: process.env });
}
