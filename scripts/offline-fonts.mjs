/**
 * Lets `next build` run on a machine that cannot reach Google Fonts.
 *
 * ---------------------------------------------------------------------------
 * `next/font/google` downloads the CSS and the font files at BUILD time and
 * self-hosts them, so production never talks to Google. But the build itself
 * does, and the cloud sandboxes the queue runner works in block
 * fonts.googleapis.com. The build then fails on the font, not on anything in
 * this repo.
 *
 * Next has a hook for exactly this, used by its own test suite:
 * `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` names a module mapping each Google Fonts
 * CSS URL to the CSS it would have returned. The same Geist variable fonts
 * Google serves are published on npm (`geist`), and npm IS reachable, so the
 * mock points at the real files, served from a throwaway localhost server for
 * the length of the build. (Not `url(/abs/path)`: webpack's font loader reads
 * those from disk, but Turbopack fetches every font URL over HTTP and rejects
 * a bare path.) What gets self-hosted is the same face; the
 * Lighthouse numbers after a mocked build are not a different site.
 *
 * Only used when Google Fonts is unreachable. On a normal machine (and on
 * Vercel) nothing here runs.
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Must match the families app/layout.tsx asks for. */
const FACES = [
  { family: "Geist", file: "dist/fonts/geist-sans/Geist-Variable.woff2" },
  { family: "Geist Mono", file: "dist/fonts/geist-mono/GeistMono-Variable.woff2" },
];

const cssUrl = (family) =>
  `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:wght@100..900&display=swap`;

async function reachable() {
  try {
    const r = await fetch(cssUrl("Geist"), { signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Returns the env vars `next build` needs and a `close` for the font server,
 * or `{ env: {} }` if Google Fonts is reachable and nothing needs faking.
 */
export async function offlineFonts() {
  if (await reachable()) return { env: {}, close: () => {} };

  const dir = join(tmpdir(), "verify-fonts");
  const pkg = join(dir, "package");
  if (!existsSync(join(pkg, FACES[0].file))) {
    await mkdir(dir, { recursive: true });
    const tgz = execFileSync("npm", ["pack", "geist", "--silent"], { cwd: dir })
      .toString()
      .trim()
      .split("\n")
      .pop();
    execFileSync("tar", ["xzf", tgz], { cwd: dir });
  }

  const server = createServer(async (req, res) => {
    const face = FACES.find((f) => req.url === `/${f.file.split("/").pop()}`);
    if (!face) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": "font/woff2" });
    res.end(await readFile(join(pkg, face.file)));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const mock = Object.fromEntries(
    FACES.map(({ family, file }) => [
      cssUrl(family),
      `/* latin */
@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(${origin}/${file.split("/").pop()}) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`,
    ]),
  );
  const file = join(dir, "mocked-responses.cjs");
  await writeFile(file, `module.exports = ${JSON.stringify(mock, null, 2)};\n`);
  console.log("note  fonts.googleapis.com unreachable; building with Geist from npm");
  return {
    env: { NEXT_FONT_GOOGLE_MOCKED_RESPONSES: file },
    close: () => server.close(),
  };
}
