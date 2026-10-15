import { chat } from "@/content/chat";
import { fillOwner, site } from "@/content/site";
import { chatEnabled } from "./flag";
import { guardReply } from "./guard";
import { buildKnowledge } from "./knowledge";
import { answerLocally } from "./local";
import { askModel, DEFAULT_MODEL, HANDOFF_MARK, systemPrompt, UNKNOWN_MARK, type ModelFetch } from "./model";
import { chatRequestSchema, MAX_TURNS, userTurns, type ChatRequest, type ChatResponse } from "./request";

/**
 * Site chat endpoint. Stateless: the widget sends the transcript each turn.
 *
 * Order of answerers: the model (when ANTHROPIC_API_KEY is set), checked by
 * the guard; then the local keyword answerer; then a fixed reply. Whatever the
 * path, the visitor only ever sees text from the content modules or a model
 * reply whose every number, email and domain is on the site.
 *
 * 404 when CHAT_ENABLED is off, so production has no chat endpoint at all
 * until the flag is set.
 */
const KNOWLEDGE = buildKnowledge();
const SYSTEM = systemPrompt(site.name, site.owner.name);

/** The route body, with the env and fetch injectable for tests. */
export async function handleChat(
  request: Request,
  deps: { env: Record<string, string | undefined>; fetcher?: ModelFetch },
): Promise<Response> {
  if (!chatEnabled(deps.env)) return new Response("Not found", { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  return Response.json(await answer(parsed.data, deps));
}

async function answer(req: ChatRequest, deps: { env: Record<string, string | undefined>; fetcher?: ModelFetch }): Promise<ChatResponse> {
  if (userTurns(req) > MAX_TURNS) return { reply: chat.replies.tooLong, handoff: true, source: "fixed" };

  const question = req.messages.at(-1)!.content;
  const apiKey = deps.env.ANTHROPIC_API_KEY;
  if (!apiKey) return answerLocally(question);

  // The Messages API wants the first message from the user.
  const firstUser = req.messages.findIndex((m) => m.role === "user");
  try {
    const { text, usage } = await askModel({
      apiKey,
      model: deps.env.CHAT_MODEL || DEFAULT_MODEL,
      system: SYSTEM,
      knowledge: KNOWLEDGE,
      messages: req.messages.slice(firstUser),
      fetcher: deps.fetcher,
    });
    // One line per turn: enough to check the cost estimate against real usage.
    console.info("[chat] usage", JSON.stringify(usage));

    if (!text || text.includes(UNKNOWN_MARK)) return { reply: chat.replies.unknown, handoff: true, source: "fixed" };

    const handoff = text.includes(HANDOFF_MARK);
    const reply = text.replaceAll(HANDOFF_MARK, "").trim();
    const verdict = guardReply(reply, KNOWLEDGE);
    if (!verdict.ok) {
      console.warn("[chat] guard rejected a reply:", verdict.reason);
      return { reply: fillOwner(chat.replies.unverified), handoff: true, source: "fixed" };
    }
    return { reply, handoff, source: "model" };
  } catch (error) {
    console.error("[chat] model call failed, answering locally:", error);
    return answerLocally(question);
  }
}
