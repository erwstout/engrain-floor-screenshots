import { SCALE_OPTIONS, STAGE_SIZE_PX } from "../capture/captureFloor";

interface Props {
  scale: number;
  onScaleChange: (scale: number) => void;
  outputDirName?: string;
  onPickDir: () => void;
  pickError?: string;
  disabled: boolean;
}

export const CaptureSettings = ({ scale, onScaleChange, outputDirName, onPickDir, pickError, disabled }: Props) => (
  <div className="field">
    <div className="row">
      <label className="field inline">
        <span>Resolution</span>
        <select
          data-testid="scale-select"
          value={scale}
          disabled={disabled}
          onChange={(e) => onScaleChange(Number(e.target.value))}
        >
          {SCALE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}x ({(STAGE_SIZE_PX * s).toLocaleString()}px)
            </option>
          ))}
        </select>
      </label>

      <button type="button" data-testid="pick-dir" disabled={disabled} onClick={onPickDir}>
        {outputDirName ? "Change folder" : "Choose output folder"}
      </button>
      <span data-testid="output-dir" className="muted">
        {outputDirName ?? "No folder selected"}
      </span>
    </div>
    <small className="muted" data-testid="pick-dir-hint">
      Chrome blocks top-level folders like Documents, Desktop, and Downloads. Pick or create a subfolder inside one,
      such as Documents/floor-captures.
    </small>
    {pickError && (
      <small className="error" data-testid="pick-dir-error">
        {pickError}
      </small>
    )}
  </div>
);
