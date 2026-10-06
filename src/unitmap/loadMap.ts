import type { UnitMap } from "./types";

const READY_TIMEOUT_MS = 30_000;

export const loadMap = (container: HTMLElement, mapId: string, apiKey: string): Promise<UnitMap> =>
  new Promise((resolve, reject) => {
    if (!window.unitmap) {
      reject(new Error("Unit Map SDK not loaded. Check the script tag and network."));
      return;
    }

    if (!container.id) {
      reject(new Error("Map container needs an id"));
      return;
    }

    const timer = setTimeout(
      () => reject(new Error(`Map ${mapId} never finished loading. Check the browser console for errors.`)),
      READY_TIMEOUT_MS,
    );
    const map = window.unitmap(container.id, apiKey);

    map.on("ready", () => {
      clearTimeout(timer);
      resolve(map);
    });
    map.on("error", (err) => {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(`Map ${mapId} failed to load`));
    });
    map.load(mapId);
  });

export const disposeMap = (map: UnitMap | undefined, container: HTMLElement) => {
  map?.remove?.() ?? map?.destroy?.();
  container.replaceChildren();
};

export const showFloor = (map: UnitMap, floorId: string) => {
  const selection = map.floors().find(floorId);
  if (!selection.length) throw new Error(`Floor ${floorId} not found on map`);
  selection.first().show();
  map.autoScale();
};
