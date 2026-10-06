import { useRef, useState } from "react";
import { useCaptureJob } from "./capture/useCaptureJob";
import { ApiKeyInput } from "./components/ApiKeyInput";
import { AssetInput } from "./components/AssetInput";
import { CapturePreview } from "./components/CapturePreview";
import { CaptureSettings } from "./components/CaptureSettings";
import { CaptureStage } from "./components/CaptureStage";
import { ProgressList } from "./components/ProgressList";
import { Spinner } from "./components/Spinner";
import { useApiKey } from "./hooks/useApiKey";
import { pickOutputDir, supportsDirectoryPicker } from "./output/writeFiles";
import { parseAssetIds } from "./utils/parseAssetIds";

export const App = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [scale, setScale] = useState(4);
  const [outputDir, setOutputDir] = useState<FileSystemDirectoryHandle>();
  const [pickError, setPickError] = useState<string>();
  const { apiKey, rawApiKey, setApiKey, remember, setRemember } = useApiKey();
  const { jobs, running, previewUrl, timeout, resolveTimeout, start, cancel } = useCaptureJob();

  const assetIds = parseAssetIds(input);
  const canRun = !running && !!apiKey && assetIds.length > 0 && !!outputDir;

  const handlePickDir = async () => {
    setPickError(undefined);
    try {
      setOutputDir(await pickOutputDir());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPickError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRun = () => {
    if (!stageRef.current || !outputDir) return;
    start({ assetIds, apiKey, container: stageRef.current, outputDir, scale });
  };

  if (!supportsDirectoryPicker()) {
    return (
      <main className="app" data-testid="unsupported">
        <h1>Engrain Floor Capture</h1>
        <p className="error">This tool needs Chrome or Edge (File System Access API).</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Engrain Floor Capture</h1>
      <p className="muted">Saves each floor as &lt;folder&gt;/&lt;assetId&gt;/&lt;assetId&gt;_floor-&lt;n&gt;.png</p>

      <ApiKeyInput
        value={rawApiKey}
        onChange={setApiKey}
        remember={remember}
        onRememberChange={setRemember}
        disabled={running}
      />
      <AssetInput value={input} onChange={setInput} disabled={running} />
      <CaptureSettings
        scale={scale}
        onScaleChange={setScale}
        outputDirName={outputDir?.name}
        onPickDir={handlePickDir}
        pickError={pickError}
        disabled={running}
      />

      <div className="row">
        <button type="button" className="primary" data-testid="run" disabled={!canRun} onClick={handleRun}>
          {running ? (
            <>
              <Spinner /> Capturing…
            </>
          ) : (
            "Capture floors"
          )}
        </button>
        {running && (
          <button type="button" data-testid="cancel" onClick={cancel}>
            Cancel
          </button>
        )}
      </div>

      <ProgressList jobs={jobs} timeout={timeout} onResolveTimeout={resolveTimeout} />
      <CapturePreview url={previewUrl} />
      <CaptureStage ref={stageRef} />
    </main>
  );
};
