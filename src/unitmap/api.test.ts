import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMaps, pickMap } from "./api";
import type { ApiMap } from "./types";

const map = (id: string, tags: string[] = []): ApiMap => ({ id, asset_id: "1", name: id, tags });

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

afterEach(() => vi.unstubAllGlobals());

describe("fetchMaps", () => {
  it("sends the API key and follows pagination", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [map("a")], paging: { next_url: "https://next" } }))
      .mockResolvedValueOnce(jsonResponse({ data: [map("b")], paging: { next_url: null } }));
    vi.stubGlobal("fetch", fetchMock);

    const maps = await fetchMaps("42", "<API_KEY>");

    expect(maps.map((m) => m.id)).toEqual(["a", "b"]);
    expect(fetchMock.mock.calls[0][0]).toContain("/maps?asset=42");
    expect(fetchMock.mock.calls[0][1].headers["API-Key"]).toBe("<API_KEY>");
  });

  it("throws a clear error for a bad key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 403)));
    await expect(fetchMaps("42", "<API_KEY>")).rejects.toThrow("rejected the API key");
  });

  it("throws on other API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(fetchMaps("42", "<API_KEY>")).rejects.toThrow("500");
  });
});

describe("pickMap", () => {
  it("prefers the ils map", () => {
    expect(pickMap([map("a"), map("b", ["ils"])])?.id).toBe("b");
  });

  it("falls back to the first map", () => {
    expect(pickMap([map("a"), map("b")])?.id).toBe("a");
  });
});
