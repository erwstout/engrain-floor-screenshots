import type { AssetJob } from "../capture/types";
import type { TimeoutPrompt as Prompt } from "../capture/useCaptureJob";
import { Spinner } from "./Spinner";
import { StatusBadge } from "./StatusBadge";
import { TimeoutPrompt } from "./TimeoutPrompt";

interface Props {
  job: AssetJob;
  timeout?: Prompt;
  onResolveTimeout: (extraSeconds: number | null) => void;
}

export const AssetProgressRow = ({ job, timeout, onResolveTimeout }: Props) => {
  const done = job.floors.filter((f) => f.status === "done").length;
  const running = job.status === "running";
  const pausedFloor = timeout && job.floors.find((f) => f.id === timeout.floorId);

  return (
    <li className="asset-row" data-testid={`asset-row-${job.assetId}`}>
      <div className="row">
        {running && !pausedFloor && <Spinner testID={`asset-spinner-${job.assetId}`} />}
        <StatusBadge status={job.status} label={job.assetId} testID={`asset-status-${job.assetId}`} />
        {job.mapName && <span className="muted">{job.mapName}</span>}
        {running && job.phase && (
          <span className="muted" data-testid={`asset-phase-${job.assetId}`}>
            {job.phase}
          </span>
        )}
        {job.floors.length > 0 && (
          <span className="muted">
            {done}/{job.floors.length} floors
          </span>
        )}
      </div>
      {job.error && (
        <div className="error" data-testid={`asset-error-${job.assetId}`}>
          {job.error}
        </div>
      )}
      {pausedFloor && (
        <TimeoutPrompt
          key={pausedFloor.id}
          floorLabel={pausedFloor.label}
          message={pausedFloor.error}
          onExtend={onResolveTimeout}
          onSkip={() => onResolveTimeout(null)}
        />
      )}
      <div className="chips">
        {job.floors.map((floor) => (
          <StatusBadge
            key={floor.id}
            status={floor.status}
            label={floor.label}
            title={floor.error}
            testID={`floor-status-${job.assetId}-${floor.id}`}
          />
        ))}
      </div>
    </li>
  );
};
