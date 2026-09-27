# Launch day

The exact order to do things in, and how to know each one worked.

Written for whoever is at the keyboard on the day. It assumes the Vercel project
already exists and is building `main`, and that `embeddedintent.com` is
registered at GoDaddy and not yet pointed anywhere.

**Read this first, all the way through.** Three of these steps are ordered the
way they are for a reason, and the reasons are in the steps.

---

## What you are about to do, in one paragraph

Point the domain at Vercel; wire up mail in two halves, receiving (ImprovMX, on
the root) and sending (Resend, on a `send.` subdomain); give the server the three
secrets the contact form needs; prove a real submission arrives in a real inbox;
and only then let search engines in. The crawler block comes off **last**,
because a site that gets indexed while its form is silently dropping leads is a
worse outcome than a site that gets indexed a day late.

Budget an hour of work and up to 48 hours of waiting for DNS. Nothing here is
irreversible except step 7, and even that is a one-line revert.

---

## 0. Before you touch DNS

- [ ] `main` is green: `npm run typecheck && npm run lint && npm run build`.
- [ ] The Vercel project's Production branch is `main`.
- [ ] You can log in to **GoDaddy**, **Vercel**, **ImprovMX** and **Resend**.
- [ ] Work through `CONTENT_TODO.md` → **🚨 Launch-blocking**. Everything in that
      section is there because shipping without it does measurable harm.

> **Never put any of these values in the repo.** No `.env` file is committed and
> none should be. Every secret below lives in the Vercel dashboard only.

---

## 1. Point the domain at Vercel (GoDaddy)

**In Vercel first:** Project → Settings → Domains → add `embeddedintent.com`,
then add `www.embeddedintent.com`. Vercel will then *show you the exact records
to create*, and which one is the redirect.

**Then in GoDaddy:** Domain → DNS → Records.

| Type  | Name  | Value                                  | TTL    |
| ----- | ----- | -------------------------------------- | ------ |
| A     | `@`   | **the IP Vercel shows you**            | 1 hour |
| CNAME | `www` | **the target Vercel shows you**        | 1 hour |

> ⚠️ **Copy the apex `A` value out of the Vercel dashboard, not out of this file
> and not out of a blog post.** Vercel has changed that IP more than once. An
> out-of-date one does not error — it resolves to something that is not your
> site, which looks exactly like a slow DNS propagation for as long as you are
> willing to believe it.

GoDaddy ships a parking `A` record on `@` and sometimes a `CNAME` on `www`.
**Edit them, do not add beside them.** Two `A` records on the apex means half of
your visitors get the parking page.

### Verify

```bash
dig +short embeddedintent.com A
dig +short www.embeddedintent.com CNAME
curl -sI https://embeddedintent.com | head -n 1     # expect: HTTP/2 200
curl -sI https://www.embeddedintent.com | head -n 1 # expect: a 30x to the apex
```

In Vercel, both domains should show **Valid Configuration** and the certificate
should be issued. If the padlock is missing, wait — Vercel issues the certificate
after DNS resolves, and it is not instant.

---

## 2. Receiving mail: ImprovMX on the root

This is what makes `hello@embeddedintent.com` — the address printed in the footer
and used as `AUDIT_TO_EMAIL` — land in a real inbox. It forwards; it does not
store.

**In ImprovMX:** add the domain `embeddedintent.com`, then the alias
`hello@` → your real mailbox. ImprovMX shows the records it needs.

**In GoDaddy:**

| Type | Name | Value                              | Priority | TTL    |
| ---- | ---- | ---------------------------------- | -------- | ------ |
| MX   | `@`  | `mx1.improvmx.com`                 | 10       | 1 hour |
| MX   | `@`  | `mx2.improvmx.com`                 | 20       | 1 hour |
| TXT  | `@`  | `v=spf1 include:spf.improvmx.com ~all` |      | 1 hour |

Delete any MX records GoDaddy created for its own mail product. Mail goes to the
lowest-priority MX that answers; a leftover GoDaddy MX at priority 0 quietly wins.

> ⚠️ **There can be exactly one SPF record on the root.** Not two, not one per
> sender — that is an SPF `permerror` and receivers treat it as a failure. If a
> second sender ever needs the root, merge it into this one record as another
> `include:`. This is also the reason Resend goes on a subdomain in step 3
> instead of here.

### Verify

```bash
dig +short embeddedintent.com MX
dig +short embeddedintent.com TXT | grep spf1   # exactly ONE line
```

Then send a real message from a personal address to `hello@embeddedintent.com`
and confirm it arrives. ImprovMX's dashboard shows a delivery log — use it to
tell "not forwarded" from "forwarded and filed as spam".

This also closes the open item in `CONTENT_TODO.md` about whether that address
actually receives anything.

---

## 3. Sending mail: Resend on `send.embeddedintent.com`

The contact form sends *through* Resend, from a subdomain.

**Why a subdomain:** the root's reputation belongs to mail a human sends, and its
SPF record already belongs to ImprovMX. Giving the robot its own subdomain means
a bad week of deliverability on transactional mail cannot damage the address on
your business card, and the two SPF records never have to share a line.

**In Resend:** Domains → Add Domain → `send.embeddedintent.com`. Resend then
shows three records. Two are the same for everyone; **the DKIM one is unique to
your account and must be copied from that screen.**

**In GoDaddy** — note the `Name` column: GoDaddy appends the domain for you, so
you type `send`, not `send.embeddedintent.com`.

| Type | Name                    | Value                                   | TTL    |
| ---- | ----------------------- | --------------------------------------- | ------ |
| TXT  | `resend._domainkey.send`| **the long `p=...` key Resend shows you**| 1 hour |
| TXT  | `send`                  | the SPF line Resend shows you           | 1 hour |
| MX   | `send`                  | the feedback host Resend shows you (priority 10) | 1 hour |

The DKIM value is long and GoDaddy's field will wrap it. Paste it in one go and
re-open the record afterwards to check nothing was truncated.

Optional but recommended, and not part of the asked list — a DMARC policy on the
root, in monitoring mode, so you find out who is sending as you:

| Type | Name      | Value                                             |
| ---- | --------- | ------------------------------------------------- |
| TXT  | `_dmarc`  | `v=DMARC1; p=none; rua=mailto:hello@embeddedintent.com` |

### Verify

```bash
dig +short resend._domainkey.send.embeddedintent.com TXT
dig +short send.embeddedintent.com TXT
dig +short send.embeddedintent.com MX
```

Then in Resend, press **Verify**. Do not move on until the domain shows
**Verified** — an unverified domain does not send, and the form will report that
it is not configured.

---

## 4. The three environment variables (Vercel)

Vercel → Project → Settings → Environment Variables. Add all three to
**Production**. Add them to **Preview** too if you want the form working on
preview deploys.

| Name               | Value                                   | Notes |
| ------------------ | --------------------------------------- | ----- |
| `RESEND_API_KEY`   | `re_...` from Resend → API Keys         | **Sending access only.** Never full access. |
| `AUDIT_TO_EMAIL`   | `hello@embeddedintent.com`              | Where leads land. The ImprovMX alias from step 2. |
| `AUDIT_FROM_EMAIL` | e.g. `audit@send.embeddedintent.com`    | **Must** be on the domain verified in step 3. |

`AUDIT_FROM_EMAIL` on a domain Resend has not verified is the single most likely
thing to go wrong here, and it fails at send time rather than at deploy time.

`app/api/audit/route.ts` treats any of the three being missing as a **500 with a
visible error**, on purpose: the alternative is a deploy that shows every visitor
a thank-you page and drops their message.

### Verify

They will not exist in the running app until you redeploy — that is step 5.

---

## 5. Redeploy

Environment variables are read at build and boot. A deploy that predates them
cannot see them, no matter how long you wait.

Vercel → Deployments → the latest Production deploy → **Redeploy**.

### Verify

```bash
curl -sI https://embeddedintent.com | head -n 1
curl -s https://embeddedintent.com/sitemap.xml | grep -c "<loc>"   # expect 18
curl -s https://embeddedintent.com/manifest.webmanifest | head -c 80
```

Open the site and check that the analytics beacons are live — they only mount on
Vercel (see `ON_VERCEL` in `app/layout.tsx`), so this is the first moment they
can be seen. In devtools → Network you should see `/_vercel/insights/script.js`
and `/_vercel/speed-insights/script.js` return **200**. Speed Insights starts
showing field data after real visitors arrive, not immediately.

---

## 6. Send a real lead through the form

Not a curl. Open `https://embeddedintent.com/contact` in a browser and fill it in
like a person would, with a real address you can check.

Confirm, in order:

1. The form shows its success state.
2. The message arrives at `AUDIT_TO_EMAIL`.
3. It is **not** in spam. If it is, check the DKIM record from step 3 first —
   that is almost always it.
4. Resend → Logs shows the send as delivered.
5. Vercel → Logs shows no error from `/api/audit`.

The form has a honeypot field and a time trap, and **both deliberately return
success without sending**. So a submission filled in by a script, or in under a
couple of seconds, will look like it worked and quietly go nowhere. Fill the form
in at human speed or you will spend an hour debugging DNS that is fine.

**Do not continue until a real message has arrived in a real inbox.** Everything
before this point is reversible in minutes. Step 7 invites the world in.

---

## 7. Let search engines in

Two files, **one commit**. robots.txt stops *crawling*; the meta tag stops
*indexing*. A URL can be indexed from an external link without ever being
crawled, so removing only one leaves the site half-hidden in a way that is hard
to notice.

**`app/robots.ts`** — replace the body of `robots()` with:

```ts
return {
  rules: { userAgent: "*", allow: "/" },
  sitemap: `${site.url}/sitemap.xml`,
};
```

…and add `import { site } from "@/content/site";` at the top. Delete the
pre-launch warning block while you are in there.

**`app/layout.tsx`** — delete this from the `metadata` object, and its comment:

```ts
robots: { index: false, follow: false },
```

Commit, push, let Vercel deploy.

### Verify

```bash
curl -s https://embeddedintent.com/robots.txt
# expect:  User-Agent: *
#          Allow: /
#          Sitemap: https://embeddedintent.com/sitemap.xml

curl -s https://embeddedintent.com/ | grep -o '<meta name="robots"[^>]*>'
# expect: NOTHING. Any output here means the meta tag is still there.
```

Also confirm one canonical, pointing at the real host:

```bash
curl -s https://embeddedintent.com/websites | grep -o '<link rel="canonical"[^>]*>'
```

---

## 8. Google Search Console

**Only now.** A sitemap submitted while `robots.txt` says `Disallow: /` produces
a page of warnings and teaches you nothing.

1. Add the property. **Domain** property (DNS TXT) covers every subdomain and
   protocol and is worth the extra record; a **URL prefix** property is quicker.
2. Verify. For the domain type, add the TXT record Search Console gives you to
   `@` at GoDaddy — it does not conflict with the SPF record, a domain can have
   many TXT records and only one *SPF* one.
3. Sitemaps → submit `sitemap.xml`.
4. URL Inspection on `https://embeddedintent.com/` → **Request Indexing**.

### Verify

Sitemaps should read **Success**, with 18 discovered URLs. Coverage takes days to
populate — that is normal and there is nothing to fix in the meantime.

---

## After the launch

- [ ] Create the Google Business Profile (`CONTENT_TODO.md`).
- [ ] Rate-limit `/api/audit` (`CONTENT_TODO.md` — it is open to the internet now).
- [ ] Check Speed Insights after a week of real traffic. Lab numbers are in
      `MOTION.md`; the field numbers are the ones that count, and they are the
      first honest test of every performance decision recorded there.
- [ ] Above All Tent Rentals is at PageSpeed 64 mobile. It is the only case study
      on the site, and it is the proof for the thing we sell.

---

## If something is wrong

| What you see | Look here first |
| --- | --- |
| Domain shows GoDaddy parking | A second `A` record on `@`. Step 1. |
| Vercel says Invalid Configuration | Apex `A` copied from somewhere other than the Vercel dashboard. Step 1. |
| Mail to `hello@` vanishes | A leftover GoDaddy MX outranking ImprovMX. Step 2. |
| Form says "not configured to send yet" | One of the three variables is missing, or you have not redeployed. Steps 4 and 5. |
| Form succeeds, no mail | `AUDIT_FROM_EMAIL` is not on the Resend-verified domain. Step 3. |
| Form succeeds, nothing in Resend logs | You tripped the honeypot or the time trap. Fill it in by hand. Step 6. |
| Lead arrives in spam | DKIM. Re-check `resend._domainkey.send` for truncation. Step 3. |
| Site still not indexed after a week | `curl` the two checks in step 7. One of them is usually still on. |
