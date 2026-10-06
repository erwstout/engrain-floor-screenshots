import type { AssetJob } from "../capture/types";
import type { TimeoutPrompt } from "../capture/useCaptureJob";
import { AssetProgressRow } from "./AssetProgressRow";

interface Props {
  jobs: AssetJob[];
  timeout?: TimeoutPrompt;
  onResolveTimeout: (extraSeconds: number | null) => void;
}

export const ProgressList = ({ jobs, timeout, onResolveTimeout }: Props) => {
  if (!jobs.length) return null;

  return (
    <ul className="progress" data-testid="progress-list">
      {jobs.map((job) => (
        <AssetProgressRow
          key={job.assetId}
          job={job}
          timeout={timeout?.assetId === job.assetId ? timeout : undefined}
          onResolveTimeout={onResolveTimeout}
        />
      ))}
    </ul>
  );
};
