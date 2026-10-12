/**
 * A minimal Chrome DevTools Protocol client, for the checks in this directory.
 *
 * No dependency: `WebSocket` and `fetch` are built into Node, and Chrome's
 * protocol is a JSON envelope over one socket. Point `CHROME_BIN` at a
 * `chrome-headless-shell` binary — see BUILD_NOTES.md for how this machine got
 * one without root.
 */
import { spawn } from "node:child_process";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function connect({
  width = 390,
  height = 844,
  mobile = true,
  reduced = false,
  port = 9222,
  profile = "check",
  scale,
} = {}) {
  const bin = process.env.CHROME_BIN;
  if (!bin) throw new Error("set CHROME_BIN to a chrome-headless-shell binary");

  const chrome = spawn(
    bin,
    [
      "--headless",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=/tmp/cdp-${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", detached: true },
  );

  const wsUrl = await (async () => {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/json/version`);
        return (await r.json()).webSocketDebuggerUrl;
      } catch {
        await sleep(250);
      }
    }
    throw new Error("chrome never came up");
  })();

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));

  let nextId = 1;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { res, rej } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rej(new Error(JSON.stringify(message.error)));
      else res(message.result);
    } else {
      listeners.forEach((f) => f(message));
    }
  };

  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);

  const resize = (w, h) =>
    send(
      "Emulation.setDeviceMetricsOverride",
      { width: w, height: h, deviceScaleFactor: scale ?? (mobile ? 3 : 1), mobile },
      sessionId,
    );
  await resize(width, height);

  if (reduced) {
    await send(
      "Emulation.setEmulatedMedia",
      { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
      sessionId,
    );
  }

  const nav = async (url, settle = 700) => {
    const loaded = new Promise((r) => {
      const f = (m) => {
        if (m.method === "Page.loadEventFired") {
          listeners.splice(listeners.indexOf(f), 1);
          r();
        }
      };
      listeners.push(f);
    });
    await send("Page.navigate", { url }, sessionId);
    await loaded;
    await sleep(settle);
  };

  const evalJs = async (expression) => {
    const { result, exceptionDetails } = await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId,
    );
    if (exceptionDetails) {
      throw new Error(
        JSON.stringify(exceptionDetails.exception?.description ?? exceptionDetails),
      );
    }
    return result.value;
  };

  /*
   * Chrome spawns zygote and renderer children of its own; killing the parent
   * leaves them running, and they are not cheap. Kill the process group.
   */
  const close = () => {
    try {
      process.kill(-chrome.pid, "SIGKILL");
    } catch {
      /* no group */
    }
    try {
      chrome.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  };

  return { evalJs, nav, resize, close, send, sessionId };
}
