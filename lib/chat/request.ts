import { z } from "zod";

import { MAX_CHARS } from "./shared";

/**
 * The chat request, validated on the server. The widget sends the whole
 * transcript each turn (the server keeps nothing), so the caps here are also
 * the cost caps: at most MAX_TURNS visitor messages of MAX_CHARS each reach
 * the model. One turn past the cap gets the fixed "talk to a person" reply
 * rather than a 400, so the widget can say something useful.
 */
export const MAX_TURNS = 8;

const message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatRequestSchema = z
  .object({ messages: z.array(message).min(1).max((MAX_TURNS + 1) * 2) })
  .refine((r) => r.messages.at(-1)?.role === "user", { message: "Last message must be the visitor's." })
  .refine((r) => (r.messages.at(-1)?.content.length ?? 0) <= MAX_CHARS, { message: "Message too long." });

export type ChatMessage = z.infer<typeof message>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ChatResponse = {
  reply: string;
  /** Show the name / business / phone form now. */
  handoff: boolean;
  /** Which answerer produced the reply. For logs and tests, not shown. */
  source: "model" | "local" | "fixed";
};

export const userTurns = (r: ChatRequest) => r.messages.filter((m) => m.role === "user").length;
