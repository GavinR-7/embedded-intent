# Site chat: spec

The chat on embeddedintent.com. It's the "AI Lead Response" product, built for
our own site first. Behind a flag, and off in production.

## What it does

- **It answers** questions about our services, prices, timelines, the service
  area, contact details and the FAQ. That's everything in `content/services.ts`,
  `content/faq.ts`, `content/site.ts` and `content/audit.ts`.
  `lib/chat/knowledge.ts` turns those modules into one text block. The model
  sees only that block, so a price change in the content module reaches the
  chat on the next deploy.
- **It collects** the visitor's name, business and phone, then hands off to the
  audit form on /contact with those fields filled in. It also puts the
  visitor's questions in the message box. The chat never submits anything.
  The visitor adds an email on the form and sends it. The audit endpoint
  validates the submission exactly as it does today.
- **It shows the handoff** in three cases: the visitor asks for a quote, a
  person or a callback; the chat doesn't know the answer; or the visitor taps
  "Leave your number", which is always visible.

## What it refuses

1. **Anything not in the knowledge block.** The model is told to reply with
   `[[UNKNOWN]]`, and the server swaps in a fixed line: "isn't something this
   site covers, so I won't make up an answer", plus the handoff.
2. **Invented numbers.** `lib/chat/guard.ts` checks every model reply before
   the visitor sees it. Every dollar amount, number (except 0–10), email
   address and domain in the reply must also appear in the knowledge block.
   If one doesn't, the reply is discarded and the visitor gets a fixed
   "I'd rather not guess, leave your number" line.
   - This also catches arithmetic. "$1,650 for the first month" isn't on the
     site, so it's a quote, and quotes come from Gavin.
3. **Quotes, dates and promises.** The prompt forbids them: a real quote comes
   after the free audit.
4. **Off-topic requests.** The chat only helps with questions about Embedded
   Intent.
5. **Long conversations.** After 8 visitor messages the chat stops calling the
   model and offers the handoff. Messages are capped at 500 characters.

What the guard can't catch: a wrong sentence with no number, email or link in
it. The prompt and temperature 0 are what guard against that. Every turn's
usage is logged so real conversations can be read in Vercel's logs.

## How it answers

| Order | Answerer | When |
|---|---|---|
| 1 | Model (Claude Haiku 5.5), then the guard | `ANTHROPIC_API_KEY` is set |
| 2 | Local keyword answerer (`lib/chat/local.ts`) | No key, or the model call failed |
| 3 | Fixed reply (`content/chat.ts`) | Unknown question, guard rejection, turn cap |

The local answerer fills `content/chat.ts` templates with content-module
values, so it can't say anything the site doesn't say. It's why a preview
works without a key. It's also a real fallback if the API is down.

## Cost per conversation

**Prices.** Claude Haiku 5.5 for prompts up to 100k tokens:

- $0.10 per million input tokens
- $0.125 per million 5-minute cache-write tokens
- $0.01 per million cache-hit tokens
- $0.50 per million output tokens

Source: <https://platform.claude.com/docs/en/about-claude/pricing>, checked
2026-10-15.

**Prompt size.** The knowledge block is 16,027 characters, about 4,000 tokens
at about 4 characters per token. With the rules that's about 4,300 tokens, and
the estimate below rounds up to 5,300 for safety. The block is sent as a
cached system prompt.

**Typical conversation:** 6 visitor messages, about 150 output tokens each.

| Part | Tokens | Cost |
|---|---|---|
| Cache write, turn 1 | 5,300 | $0.00066 |
| Cache reads, turns 2–6 | 5 × 5,300 | $0.00027 |
| Uncached history across 6 turns | ~2,550 | $0.00026 |
| Output | 6 × 150 | $0.00045 |
| **Total** | | **≈ $0.0016** |

**Worst case:** all 8 turns, no cache hits, the full 350 output tokens every
turn. That's about 60,000 input and 2,800 output tokens, **≈ $0.0074**.

So a conversation costs under one cent either way. 1,000 conversations a month
would cost about $1.60 typically and $7.40 at worst. This is an estimate from
list prices. The `[chat] usage` log line on every turn gives the real token
counts to check it against.

**Why Haiku 5.5:** it's the cheapest current Claude model. The job is short
answers from a 4k-token document under strict rules, which is well within its
range, and the guard backs it up on the expensive failure. `CHAT_MODEL` can
swap the model without a code change if real transcripts show it isn't enough.

## Flag and env vars (Gavin adds these; none are created by the agent)

| Var | Where | Value |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel: Preview and Production | From console.anthropic.com. Unset means local answers only. |
| `CHAT_ENABLED` | Vercel: Production, at launch | `1` turns the chat on. Unset is on in previews, off in production. `0` forces it off. |
| `CHAT_MODEL` | Optional | Defaults to `claude-haiku-5-5`. |

Before turning it on in production:

- Set a monthly spend limit on the Anthropic account. $10 covers more than
  1,000 worst-case conversations.
- If the Vercel plan allows it, add a firewall rate-limit rule on `/api/chat`.
  The endpoint has no login, so the per-request caps above are what bound the
  cost of abuse.

## Out of scope for this PR

- Booking from the calendar.
- Follow-up texts.
- Storing transcripts.
- Per-client knowledge (the client version).

Each is its own task once this one has run on our own site.
