export interface ApiMap {
  id: string;
  asset_id: string;
  name: string;
  tags: string[];
}

export interface ApiList<T> {
  data: T[];
  paging?: { next_url: string | null };
}

export interface SdkFloorData {
  id: string;
  label: string;
  shortLabel: string;
}

export interface SdkFloor extends SdkFloorData {
  show(): SdkFloor;
}

export interface SdkFloorSelection {
  length: number;
  at(index: number): SdkFloorSelection;
  find(id: string | string[]): SdkFloorSelection;
  first(): SdkFloorSelection;
  show(): SdkFloorSelection;
  data(): SdkFloorData[];
}

export interface UnitMap {
  load(mapId: string): void;
  on(event: string, cb: (...args: unknown[]) => void): void;
  floors(): SdkFloorSelection;
  floor(): SdkFloor;
  autoScale(): void;
  remove?(): void;
  destroy?(): void;
}

// Takes the container element's id, not the element. Matches the SDK Getting Started example.
export type UnitMapFactory = (elementId: string, apiKey: string) => UnitMap;

declare global {
  interface Window {
    unitmap?: UnitMapFactory;
  }
}
