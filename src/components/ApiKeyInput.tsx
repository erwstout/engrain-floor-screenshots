interface Props {
  value: string;
  onChange: (value: string) => void;
  remember: boolean;
  onRememberChange: (value: boolean) => void;
  disabled: boolean;
}

export const ApiKeyInput = ({ value, onChange, remember, onRememberChange, disabled }: Props) => (
  <div className="field">
    <label className="field">
      <span>Unit Map API key</span>
      <input
        data-testid="api-key-input"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder="Paste your key"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
    <label className="checkbox muted">
      <input
        data-testid="remember-key"
        type="checkbox"
        checked={remember}
        disabled={disabled}
        onChange={(e) => onRememberChange(e.target.checked)}
      />
      Remember in this browser
    </label>
    <small className="muted">The key goes only from your browser to api.unitmap.com. It is never bundled or sent anywhere else.</small>
  </div>
);
