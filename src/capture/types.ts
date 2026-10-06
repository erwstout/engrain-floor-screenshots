export type Status = "pending" | "running" | "paused" | "done" | "error";

export interface FloorJob {
  id: string;
  label: string;
  status: Status;
  error?: string;
}

export interface AssetJob {
  assetId: string;
  status: Status;
  phase?: string;
  mapName?: string;
  floors: FloorJob[];
  error?: string;
}
