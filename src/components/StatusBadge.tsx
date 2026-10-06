import type { Status } from "../capture/types";

interface Props {
  status: Status;
  label: string;
  title?: string;
  testID?: string;
}

export const StatusBadge = ({ status, label, title, testID }: Props) => (
  <span className={`badge badge-${status}`} title={title} data-testid={testID} data-status={status}>
    {label}
  </span>
);
