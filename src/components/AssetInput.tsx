import { parseAssetIds } from "../utils/parseAssetIds";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const AssetInput = ({ value, onChange, disabled }: Props) => {
  const count = parseAssetIds(value).length;

  return (
    <label className="field">
      <span>Asset IDs</span>
      <textarea
        data-testid="asset-input"
        rows={5}
        placeholder="One per line, or comma separated"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <small data-testid="asset-count">{count} asset{count === 1 ? "" : "s"}</small>
    </label>
  );
};
