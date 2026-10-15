# AI receptionist (inbound): spec

An AI voice agent answers Embedded Intent's own line, (631) 240-3073. It says it
is an AI and that the call may be recorded. It books a 15-minute intro call with
Gavin, or takes a message, and texts Gavin one summary per call.

Behind `RECEPTIONIST_ENABLED`. Nothing in this PR creates an account, spends
money, or points a phone number anywhere. Research and price sources:
`hq/research/ai-receptionist-inbound.md` (vendor pages checked 2026-10-15).

## How a call runs

```
caller ─▶ Twilio number ─▶ Retell agent (voice, LLM, recording)
                               │  custom functions (signed)
                               ├──▶ POST /api/voice/tools  check_slots ─▶ Cal.com GET /v2/slots
                               │                           book        ─▶ Cal.com POST /v2/bookings
                               │  webhook (signed)
                               └──▶ POST /api/voice/post-call  call_analyzed ─▶ Twilio SMS ─▶ Gavin
```

1. **Greeting, with the disclosure first:** "This is the AI assistant for
   Embedded Intent. This call may be recorded and summarized." Every call, in
   the opening line (`content/receptionist.ts` → `greeting`). Callers come
   from all-party-consent states, so the agent always discloses.
2. Name → business and need → callback number. The agent reads back only the
   last four digits of the caller ID.
3. **Booking.** `check_slots` returns up to three real open times from
   Cal.com: the first open time on each of the next days, within 7 days, read
   in Eastern time. The agent offers two. On `book`, the server checks the
   chosen time against a fresh slot list before booking, so a time the model
   invents or mishears is never booked. The agent says "booked" only when
   `book` said so.
4. **No booking:** the caller declines, Cal.com is down, or the week is full.
   The agent takes a message and says Gavin usually calls back within one
   business day.
5. **The text to Gavin.** On `call_analyzed`, one SMS to
   `RECEPTIONIST_NOTIFY_TO`:
   - format: `EI call: <name> (<business>), <number>. BOOKED Tue Oct 20 10:00 AM ET | No booking. <reason> Retell <call_id>`;
   - at most 300 characters, plain GSM-7 characters only (two segments at most);
   - the booked time is taken from what Cal.com confirmed, never from the
     model's summary.

   An example is in `docs/receptionist/dry-run.md`.

## What it never says or does

The prompt is built from this list (`content/receptionist.ts` → `never`).
`tests/voice` checks that every rule is in the prompt and that the prompt
contains no prices.

- No prices, ranges, discounts or timelines. Its line is: "Gavin goes over
  pricing on the intro call, and every quote is written." (Prices appear only
  on service pages.)
- No promised results: no rankings, no lead, call or review counts, no
  guarantees.
- No legal, tax, financial or medical advice. It never says whether something
  is legal.
- It never claims to be a person, never says Gavin is on the line, and never
  promises a callback time other than a booked slot.
- It never invents a time slot.
- It never takes payment, card numbers, passwords, SSNs or logins.
- It never names other clients, and never shares Gavin's personal number,
  email or address.
- Sales pitches and surveys get a one-line message, then the call ends.
  Abusive callers: the agent says it is ending the call, then ends it.

## Booking: Cal.com with no API key

`GET /v2/slots` and `POST /v2/bookings` are public endpoints, addressed by
username + event type slug (https://cal.com/docs/agents, checked 2026-10-15).
So a **free** Cal.com account works, and `CAL_API_KEY` is optional.
- Free accounts can also create keys: Settings → Developer → API Keys.
- A key, when set, is sent as a Bearer token.
- Headers: slots use `cal-api-version: 2024-09-04`; bookings use
  `cal-api-version: 2026-02-25`.

**Event type setup (Gavin):**
- 15 minutes, slug `intro-15` or any other; it goes in `CAL_EVENT_SLUG`.
- Location: phone; Gavin calls the attendee.
- Booking questions: make **email optional**. The phone agent collects a name
  and a number, not an email. Cal.com's default form requires email, and a
  booking without one is refused.
- Minimum notice: 2 hours or more.

The first live test call shows whether the email setting is right. If Cal.com
refuses, the agent falls back to taking a message, and the text to Gavin says
"No booking".

## Security

- **Every request to both routes must carry a valid `X-Retell-Signature`.**
  The signature is an HMAC-SHA256 of the raw body plus a timestamp, keyed with
  the Retell API key. A timestamp more than 5 minutes off is rejected. Retell's
  SDK algorithm is reimplemented in `lib/voice/signature.ts`.
- Route order: flag off → 404; config missing → 503 (the log names the
  variables); bad signature → 401; bad body → 400.
- Cal.com and Twilio are never called before the signature check passes.
- Retries: Retell retries a webhook up to 3 times. Call IDs are deduped in
  memory. A retry that lands on another instance can still send a duplicate
  text, but only to Gavin.
- Recordings and transcripts stay in Retell. Nothing about a call is stored on
  the site.

## Flag and environment

| Variable | Required | What |
|---|---|---|
| `RECEPTIONIST_ENABLED` | yes | `1` turns both routes on. Anything else, preview deploys included, gives 404. |
| `RETELL_API_KEY` | yes | Retell API key. Used only to verify webhook signatures. |
| `CAL_USERNAME` | yes | Cal.com username |
| `CAL_EVENT_SLUG` | yes | The intro-call event type slug |
| `CAL_API_KEY` | no | Cal.com key. Not needed for public booking. |
| `TWILIO_ACCOUNT_SID` | yes | The Twilio account that owns the number |
| `TWILIO_AUTH_TOKEN` | yes | |
| `TWILIO_FROM_NUMBER` | yes | The Embedded Intent number, `+1...` |
| `RECEPTIONIST_NOTIFY_TO` | yes | Gavin's mobile, `+1...` |
| `BOOKING_TIMEZONE` | no | Default `America/New_York` |
| `RECEPTIONIST_CALL_LINK` | no | A URL template with `{call_id}`. When unset, the SMS ends with the call ID. Retell's API has no dashboard link field. |
| `RECEPTIONIST_DRY_RUN` | no | `1` logs the SMS instead of sending it. Use it for the first live test calls. |

## Cost

Vendor pages, checked 2026-10-15:
- https://www.retellai.com/pricing
- https://www.twilio.com/en-us/voice/pricing/us
- https://www.twilio.com/en-us/sms/pricing/us
- https://cal.com/pricing

**Per minute: about $0.0865.**

| Item | $/min |
|---|---|
| Retell voice infrastructure | 0.055 |
| Retell TTS (standard voices) | 0.015 |
| LLM: GPT 5 mini | 0.008 |
| Twilio inbound, local | 0.0085 |

With ElevenLabs Flash + Claude 4.5 Haiku instead, it is $0.1285/min. Retell's
own telephony ($0.015/min) is not used, because the call comes in on the
Twilio number.

**Per month at 30 calls × 2 min:**
- Retell + Twilio voice: about $5.19 (about $7.71 on the premium voice).
- Summary texts: 30 × $0.0118–0.0133, about $0.40.
- Twilio number: $1.15 (local; it is already needed for the missed-call
  text-back).
- Cal.com: free, one user.
- **Total: about $6.75–9.30 a month, including the number.**

Retell gives $10 of free credit, which covers the first two months of test
calls. It has no platform fee. A2P 10DLC registration fees are separate
(OPERATIONS_SETUP §6) and are shared with the text-back.

## Going live (Gavin, after review)

1. Create a Retell account (free credit) and an API key.
2. Create a Cal.com free account and the intro event type, set up as above.
3. Set the variables in Vercel, with `RECEPTIONIST_DRY_RUN=1` to start.
4. Create the Retell agent from `docs/receptionist/agent.json`. The file is
   generated from `lib/voice/agent.ts`:
   - prompt, greeting and the two custom functions pointing at
     `/api/voice/tools`;
   - webhook `/api/voice/post-call`;
   - post-call fields `caller_name`, `business`, `reason`.
5. Import the Twilio number into Retell. Keep the missed-call text-back as the
   fallback for when the agent is unreachable.
6. Make 10 scripted test calls (see the research file, step 6): booking, no
   booking, wrong number, silence, hang-up, noise, abusive, out of scope, a
   price question, and "are you a person?". Record latency and failures.
7. Unset `RECEPTIONIST_DRY_RUN`. Gavin decides whether the number goes out.

## Files

- `content/receptionist.ts`: everything the agent says, the rules, and the SMS labels.
- `lib/voice/`:
  - `signature.ts`, `config.ts` (flag and env), `cal.ts`;
  - `tools.ts` (check_slots, book), `summary.ts` (the SMS), `sms.ts`;
  - `handlers.ts` (both webhooks), `agent.ts` (the Retell config).
- `app/api/voice/{tools,post-call}/route.ts`: thin wrappers.
- `tests/voice/`:
  - unit tests;
  - the dry run, which also checks that `docs/receptionist/` is current.
