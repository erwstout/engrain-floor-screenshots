import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useApiKey } from "./useApiKey";

describe("useApiKey", () => {
  it("keeps the key in memory only by default", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => result.current.setApiKey(" abc "));

    expect(result.current.apiKey).toBe("abc");
    expect(localStorage.length).toBe(0);
  });

  it("persists when remember is on and clears when turned off", () => {
    const { result } = renderHook(() => useApiKey());
    act(() => result.current.setApiKey("abc"));
    act(() => result.current.setRemember(true));
    expect(Object.values({ ...localStorage })).toContain("abc");

    act(() => result.current.setRemember(false));
    expect(localStorage.length).toBe(0);
  });

  it("restores a remembered key", () => {
    localStorage.setItem("unitmap-api-key", "saved");
    const { result } = renderHook(() => useApiKey());

    expect(result.current.apiKey).toBe("saved");
    expect(result.current.remember).toBe(true);
  });
});
