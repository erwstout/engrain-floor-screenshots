import { API_BASE } from "./config";
import type { ApiList, ApiMap } from "./types";

const getAll = async <T>(path: string, apiKey: string): Promise<T[]> => {
  const results: T[] = [];
  let url: string | null = `${API_BASE}${path}`;

  while (url) {
    const res: Response = await fetch(url, { headers: { "API-Key": apiKey } });
    if (res.status === 401 || res.status === 403) throw new Error("Unit Map rejected the API key");
    if (!res.ok) throw new Error(`Unit Map API ${res.status} for ${path}`);
    const body = (await res.json()) as ApiList<T>;
    results.push(...body.data);
    url = body.paging?.next_url ?? null;
  }

  return results;
};

export const fetchMaps = (assetId: string, apiKey: string) =>
  getAll<ApiMap>(`/maps?asset=${encodeURIComponent(assetId)}&per-page=100`, apiKey);

// Prefer the ILS (leasing) map when an asset has several.
export const pickMap = (maps: ApiMap[]): ApiMap | undefined =>
  maps.find((m) => m.tags?.includes("ils")) ?? maps[0];
