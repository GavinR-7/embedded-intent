/**
 * The few things both sides of the chat need. No imports, so the widget can
 * use it without pulling zod (lib/chat/request.ts) into the client bundle.
 */

/** Longest visitor message the server accepts; the input enforces it too. */
export const MAX_CHARS = 500;

/** sessionStorage key the chat writes and the audit form reads once. */
export const CHAT_HANDOFF_KEY = "ei-chat-handoff";

export type ChatHandoff = {
  name: string;
  business: string;
  phone: string;
  /** The visitor's own questions, for the message box. */
  questions: string[];
};

/** Reads and removes the handoff. Null when absent, malformed or storage is blocked. */
export function takeChatHandoff(storage: Pick<Storage, "getItem" | "removeItem">): ChatHandoff | null {
  try {
    const raw = storage.getItem(CHAT_HANDOFF_KEY);
    if (!raw) return null;
    storage.removeItem(CHAT_HANDOFF_KEY);
    const v = JSON.parse(raw) as Partial<ChatHandoff>;
    const str = (x: unknown) => (typeof x === "string" ? x.slice(0, 200) : "");
    return {
      name: str(v.name),
      business: str(v.business),
      phone: str(v.phone),
      questions: Array.isArray(v.questions) ? v.questions.filter((q): q is string => typeof q === "string").slice(0, 10) : [],
    };
  } catch {
    return null;
  }
}
