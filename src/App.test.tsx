import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { SettleTimeoutError, waitForSettled } from "./capture/waitForSettled";
import { createMockDir } from "./test/mockFileSystem";
import { fetchMaps } from "./unitmap/api";
import type { ApiMap } from "./unitmap/types";

vi.mock("./unitmap/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./unitmap/api")>()),
  fetchMaps: vi.fn(async (assetId: string) => [{ id: `map-${assetId}`, asset_id: assetId, name: "Main", tags: [] }]),
}));

describe("App", () => {
  it("requires a key, asset ids, and a folder before running", async () => {
    vi.mocked(window.showDirectoryPicker).mockResolvedValue(createMockDir("maps"));
    render(<App />);
    expect(screen.getByTestId("run")).toBeDisabled();

    await userEvent.type(screen.getByTestId("asset-input"), "100, 200");
    expect(screen.getByTestId("asset-count")).toHaveTextContent("2");
    await userEvent.click(screen.getByTestId("pick-dir"));
    expect(screen.getByTestId("run")).toBeDisabled();

    await userEvent.type(screen.getByTestId("api-key-input"), "<API_KEY>");
    expect(screen.getByTestId("run")).toBeEnabled();
  });

  it("captures every floor and shows progress", async () => {
    vi.mocked(window.showDirectoryPicker).mockResolvedValue(createMockDir("maps"));
    render(<App />);

    await userEvent.type(screen.getByTestId("api-key-input"), "<API_KEY>");
    await userEvent.type(screen.getByTestId("asset-input"), "100");
    await userEvent.click(screen.getByTestId("pick-dir"));
    expect(screen.getByTestId("output-dir")).toHaveTextContent("maps");

    await userEvent.click(screen.getByTestId("run"));

    await waitFor(() => expect(screen.getByTestId("asset-status-100")).toHaveAttribute("data-status", "done"));
    expect(screen.getByTestId("floor-status-100-f1")).toHaveAttribute("data-status", "done");
    expect(screen.getByTestId("floor-status-100-f2")).toHaveAttribute("data-status", "done");
  });

  it("shows activity while finding the map", async () => {
    let resolveMaps: (maps: ApiMap[]) => void = () => undefined;
    vi.mocked(fetchMaps).mockImplementationOnce(() => new Promise((r) => (resolveMaps = r)));
    vi.mocked(window.showDirectoryPicker).mockResolvedValue(createMockDir("maps"));
    render(<App />);

    await userEvent.type(screen.getByTestId("api-key-input"), "<API_KEY>");
    await userEvent.type(screen.getByTestId("asset-input"), "100");
    await userEvent.click(screen.getByTestId("pick-dir"));
    await userEvent.click(screen.getByTestId("run"));

    expect(await screen.findByTestId("asset-spinner-100")).toBeInTheDocument();
    expect(screen.getByTestId("asset-phase-100")).toHaveTextContent("Finding map");
    expect(screen.getByTestId("run")).toHaveTextContent("Capturing");

    resolveMaps([{ id: "map-100", asset_id: "100", name: "Main", tags: [] }]);
    await waitFor(() => expect(screen.queryByTestId("asset-spinner-100")).not.toBeInTheDocument());
  });

  it("prompts for more time when a floor times out", async () => {
    vi.mocked(waitForSettled).mockRejectedValueOnce(new SettleTimeoutError(90_000));
    vi.mocked(window.showDirectoryPicker).mockResolvedValue(createMockDir("maps"));
    render(<App />);

    await userEvent.type(screen.getByTestId("api-key-input"), "<API_KEY>");
    await userEvent.type(screen.getByTestId("asset-input"), "100");
    await userEvent.click(screen.getByTestId("pick-dir"));
    await userEvent.click(screen.getByTestId("run"));

    expect(await screen.findByTestId("timeout-prompt")).toBeInTheDocument();
    expect(screen.getByTestId("floor-status-100-f1")).toHaveAttribute("data-status", "paused");

    await userEvent.clear(screen.getByTestId("timeout-seconds"));
    await userEvent.type(screen.getByTestId("timeout-seconds"), "45");
    await userEvent.click(screen.getByTestId("timeout-extend"));

    await waitFor(() => expect(screen.getByTestId("asset-status-100")).toHaveAttribute("data-status", "done"));
    expect(screen.queryByTestId("timeout-prompt")).not.toBeInTheDocument();
    expect(vi.mocked(waitForSettled).mock.calls[1][1]).toEqual({ timeoutMs: 45_000 });
  });

  it("shows a notice in unsupported browsers", () => {
    // @ts-expect-error simulate missing API
    delete window.showDirectoryPicker;
    render(<App />);
    expect(screen.getByTestId("unsupported")).toBeInTheDocument();
  });
});
