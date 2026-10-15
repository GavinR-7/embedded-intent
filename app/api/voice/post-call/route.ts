import { handlePostCall } from "@/lib/voice/handlers";

/**
 * Retell webhook for the AI receptionist (RECEPTIONIST_SPEC.md). 404 unless
 * RECEPTIONIST_ENABLED=1; every request must carry a valid X-Retell-Signature.
 */
export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handlePostCall(request, { env: process.env, now: () => new Date() });
}
