import { useState } from "react";

const DEFAULT_EXTRA_SECONDS = 60;

interface Props {
  floorLabel: string;
  message?: string;
  onExtend: (seconds: number) => void;
  onSkip: () => void;
}

export const TimeoutPrompt = ({ floorLabel, message, onExtend, onSkip }: Props) => {
  const [seconds, setSeconds] = useState(DEFAULT_EXTRA_SECONDS);
  const valid = Number.isFinite(seconds) && seconds > 0;

  return (
    <form
      className="timeout-prompt"
      data-testid="timeout-prompt"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onExtend(seconds);
      }}
    >
      <span>
        Floor {floorLabel} is still loading. {message}
      </span>
      <label className="field inline">
        <span>Wait</span>
        <input
          data-testid="timeout-seconds"
          type="number"
          min={1}
          step={10}
          value={seconds}
          onChange={(e) => setSeconds(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
        />
        <span>more seconds</span>
      </label>
      <div className="row">
        <button type="submit" className="primary" data-testid="timeout-extend" disabled={!valid}>
          Keep waiting
        </button>
        <button type="button" data-testid="timeout-skip" onClick={onSkip}>
          Skip floor
        </button>
      </div>
    </form>
  );
};
