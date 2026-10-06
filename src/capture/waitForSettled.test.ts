import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// setup.ts mocks this module globally; test the real one here.
const { waitForSettled } = await vi.importActual<typeof import("./waitForSettled")>("./waitForSettled");

const root = () => document.body.appendChild(document.createElement("div"));

describe("waitForSettled", () => {
  // Fake timers keep these deterministic on slow CI runners.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves once the DOM has been quiet", async () => {
    const settled = waitForSettled(root(), { quietMs: 50, timeoutMs: 2000 });
    await vi.advanceTimersByTimeAsync(200);
    await expect(settled).resolves.toBeUndefined();
  });

  it("waits while the DOM keeps changing", async () => {
    const el = root();
    const interval = setInterval(() => el.append(document.createElement("span")), 20);
    setTimeout(() => clearInterval(interval), 400);

    let settled = false;
    const done = waitForSettled(el, { quietMs: 100, timeoutMs: 3000 }).then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(400);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(400);
    expect(settled).toBe(true);
    await done;
  });

  it("rejects when activity never stops", async () => {
    const el = root();
    const interval = setInterval(() => el.append(document.createElement("span")), 20);

    const settled = waitForSettled(el, { quietMs: 200, timeoutMs: 500 });
    const assertion = expect(settled).rejects.toThrow("still loading");
    await vi.advanceTimersByTimeAsync(600);
    await assertion;
    clearInterval(interval);
  });
});
