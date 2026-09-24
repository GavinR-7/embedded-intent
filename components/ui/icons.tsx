/**
 * The icon set.
 *
 * A closed union rather than free-form strings: `IconName` is what lets
 * `content/services.ts` name an icon without importing React, and what makes a
 * typo in the data a build error instead of an empty square on the page.
 *
 * All icons are 24×24, stroked with `currentColor`, and carry no color of
 * their own — they take it from whatever they sit in. They are decorative
 * everywhere they are used: a label always sits beside them, so `<Icon>` is
 * `aria-hidden` and never the only way to tell two things apart.
 */

export type IconName =
  | "browser"
  | "refresh"
  | "chat"
  | "phone"
  | "star"
  | "map"
  | "target"
  | "megaphone"
  | "gears"
  | "inbox"
  | "reply"
  | "calendar"
  | "check"
  | "send"
  | "shield"
  | "search"
  | "chart"
  | "clock"
  | "user"
  | "document"
  | "bolt"
  | "filter"
  | "link"
  | "calculator";

const PATHS: Record<IconName, React.ReactNode> = {
  browser: <path d="M3 5h18v14H3V5Zm0 4h18M6 7h.01M8.5 7h.01" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  chat: <path d="M4 5h16v10H9l-5 4V5Zm4 4h8m-8 3h5" />,
  phone: (
    <path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
  ),
  star: (
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.8.9 5.4-4.6-2.5-4.6 2.5.9-5.4L4.5 9.6l5.2-.7L12 4Z" />
  ),
  map: <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  target: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  megaphone: <path d="M4 10v4a1 1 0 0 0 1 1h3l8 4V5L8 9H5a1 1 0 0 0-1 1Zm4 5v4h3v-3M19 10v4" />,
  gears: (
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-1.8-.5a6.4 6.4 0 0 0-.6-1.5l.9-1.6-1.9-1.9-1.6.9a6.4 6.4 0 0 0-1.5-.6L13 5h-2l-.5 1.8a6.4 6.4 0 0 0-1.5.6l-1.6-.9-1.9 1.9.9 1.6a6.4 6.4 0 0 0-.6 1.5L4 12v2l1.8.5a6.4 6.4 0 0 0 .6 1.5l-.9 1.6 1.9 1.9 1.6-.9a6.4 6.4 0 0 0 1.5.6L11 21h2l.5-1.8a6.4 6.4 0 0 0 1.5-.6l1.6.9 1.9-1.9-.9-1.6a6.4 6.4 0 0 0 .6-1.5L20 14v-2Z" />
  ),
  inbox: <path d="M12 3v8m0 0 3-3m-3 3-3-3M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4h-5l-1 2h-4l-1-2H4Z" />,
  reply: <path d="M9 7 4 12l5 5m-5-5h9a6 6 0 0 1 6 6v1" />,
  calendar: <path d="M4 6h16v14H4V6Zm0 4h16M9 3v4m6-4v4m-4 8 2 2 3-3" />,
  check: <path d="M20 7 10 17l-5-5" />,
  send: <path d="m21 3-9 18-2.5-7.5L2 11l19-8Zm0 0-11.5 10.5" />,
  shield: <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Zm-2.5 8.5 2 2 3.5-3.5" />,
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm5.7-2.3L21 21" />,
  chart: <path d="M4 20h16M7 20v-6m5 6V7m5 13v-9" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3.5 2" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0" />,
  document: <path d="M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6m-6 4h6" />,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />,
  filter: <path d="M4 5h16l-6 7v7l-4-2v-5L4 5Z" />,
  calculator: <path d="M5 3h14v18H5V3Zm2 4h10M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h3" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.9M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3" />,
};

export function Icon({
  name,
  className = "h-4.5 w-4.5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * The bordered square an icon sits in. Shared by the nav mega menu and the
 * service flow panels so a service's icon looks the same wherever it appears.
 */
export function IconTile({
  name,
  lit = false,
  className = "",
}: {
  name: IconName;
  /** Accent treatment, used when a flow row is active. */
  lit?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-field border transition-colors duration-[var(--duration-base)] ease-precise ${
        lit
          ? "border-signal/40 bg-signal-wash text-signal"
          : "border-line bg-transparent text-ink-subtle"
      } ${className}`}
    >
      <Icon name={name} />
    </span>
  );
}
