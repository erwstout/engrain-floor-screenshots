# Engrain Floor Capture

Internal tool. It takes Engrain asset IDs, renders each asset's Unit Map, and saves a high-resolution PNG of every floor.

```
<chosen folder>/
  12345/
    12345_floor-1.png
    12345_floor-2.png
  67890/
    67890_floor-1.png
```

## Setup

```
yarn install
yarn dev
```

Open the app in **Chrome or Edge**. It needs the File System Access API.

No API key is bundled and no environment variables are needed. Each user pastes their own Unit Map API key into the app.
- The key stays in memory unless "Remember in this browser" is checked. That stores it in this browser's localStorage.
- The key is only sent from the browser to `api.unitmap.com` and the Unit Map SDK.

## Deploy (GitHub Pages)

1. Push to a GitHub repo.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. Each push to `main` runs `.github/workflows/deploy.yml`, which runs the tests, builds, and publishes `dist/`.

`vite.config.ts` uses a relative `base`, so the build works at any `https://<user>.github.io/<repo>/` path.

Engrain may limit API keys to approved domains. If maps fail to load on Pages, ask Engrain to allow the `<user>.github.io` origin.

## Usage

1. Paste your Unit Map API key.
2. Paste asset IDs, one per line or comma separated.
3. Pick a resolution. The stage is 2000px, so 4x gives 8000px images.
4. Choose an output folder.
5. Click **Capture floors**.

Assets run one at a time. A failed floor or asset is marked red, and the batch continues.

If a floor is still loading after 90 seconds, the batch pauses and asks you to wait more seconds or skip that floor. The map stays loaded while you decide.

## How it works

- `GET /maps?asset=<id>` finds the asset's map. It prefers the `ils` map.
- The Unit Map JS SDK (`unitmap(elementId, apiKey)` then `map.load(mapId)`) renders that map into an offscreen 2000×2000 stage.
- For each floor in `map.floors()`, the tool shows the floor, calls `autoScale()` to fit it, and waits for render.
- Each PNG is built in two layers at the chosen pixel ratio:
  - The background image (SVG `<image>`, e.g. grass and roads) is fetched from its source and resized to the exact output size.
  - The map's live `<svg>` is serialized without hidden floors or raster images, and drawn on top as vectors at full output size.
- PNGs are written straight to the chosen folder.

## Scripts

| Command | What it does |
| --- | --- |
| `yarn dev` | Start the dev server |
| `yarn test` | Run the Vitest suite |
| `yarn typecheck` | Type-check |
| `yarn build` | Production build |

## Known gaps

- The background image is fetched with `cache: "no-store"`. The SDK's own load is cached without CORS headers, so a cached fetch is blocked.
- HTML overlays outside the map `<svg>` are not captured.
