import { describe, expect, it, vi } from "vitest";

// setup.ts mocks this module globally; test the real one here.
const { waitForSettled } = await vi.importActual<typeof import("./waitForSettled")>("./waitForSettled");

const root = () => document.body.appendChild(document.createElement("div"));

describe("waitForSettled", () => {
  it("resolves once the DOM has been quiet", async () => {
    await expect(waitForSettled(root(), { quietMs: 50, timeoutMs: 2000 })).resolves.toBeUndefined();
  });

  it("waits while the DOM keeps changing", async () => {
    const el = root();
    const interval = setInterval(() => el.append(document.createElement("span")), 20);
    const started = Date.now();
    setTimeout(() => clearInterval(interval), 400);

    await waitForSettled(el, { quietMs: 100, timeoutMs: 3000 });

    expect(Date.now() - started).toBeGreaterThanOrEqual(400);
  });

  it("rejects when activity never stops", async () => {
    const el = root();
    const interval = setInterval(() => el.append(document.createElement("span")), 20);

    await expect(waitForSettled(el, { quietMs: 200, timeoutMs: 500 })).rejects.toThrow("still loading");
    clearInterval(interval);
  });
});
