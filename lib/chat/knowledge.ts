/**
 * Everything the chat is allowed to know, built from the content modules.
 *
 * There is no second copy of the facts: the model's context is this text, the
 * guard (lib/chat/guard.ts) checks replies against this text, and the local
 * answerer (lib/chat/local.ts) reads the same modules. Change a price in
 * content/services.ts and all three follow on the next deploy.
 */
import { audit } from "@/content/audit";
import { faqs } from "@/content/faq";
import { formatBuild, formatMonthly, formatPriceBand, services, type Service } from "@/content/services";
import { site } from "@/content/site";

export function servicePath(service: Service): string {
  return `/services/${service.slug}`;
}

/** One service as plain text. Prices use the same formatters as the site. */
export function serviceFacts(service: Service): string {
  const p = service.pricing;
  const lines = [
    `## ${service.name} (${site.url}${servicePath(service)})`,
    `What it is: ${service.promise}`,
    `Result: ${service.outcome}`,
    `For: ${service.forWhom}`,
    `Timeline: ${service.timeline}`,
    `Build/setup price: ${formatBuild(p)}${p.buildTypical ? ` (most land at ${formatPriceBand(p.buildTypical)})` : ""}`,
    `Monthly: ${p.monthly ? formatMonthly(p.monthly) : "none"}`,
  ];
  if (p.passThrough) lines.push(`Third-party costs: ${p.passThrough}`);
  lines.push(`Includes: ${service.includes.join("; ")}`);
  if (service.notThis) lines.push(`What it is not: ${service.notThis}`);
  if (service.examples) lines.push(`Examples: ${service.examples.join("; ")}`);
  return lines.join("\n");
}

/** The whole knowledge block. Stable across requests, so it caches. */
export function buildKnowledge(): string {
  const business = [
    `# ${site.name}`,
    site.description,
    `Service area: ${site.serviceArea}`,
    `Hours: ${site.hours}`,
    `Response time: ${site.responseCommitment}`,
    site.email ? `Email: ${site.email}` : null,
    site.phone ? `Phone: ${site.phone.display}` : null,
    `Website: ${site.url}`,
    `Owner: ${site.owner.name}, ${site.owner.role}. ${site.owner.bio}`,
    `Promises: ${site.trustPoints.join("; ")}`,
    `Free audit: ${audit.form.intro} ${site.ctaMicrocopy}. Request it at ${site.url}/contact.`,
  ].filter((line): line is string => line !== null);

  return [
    business.join("\n"),
    "# Services",
    services.map(serviceFacts).join("\n\n"),
    "# FAQ",
    faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n"),
  ].join("\n\n");
}
