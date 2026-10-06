export const Spinner = ({ testID }: { testID?: string }) => (
  <span className="spinner" role="status" aria-label="Loading" data-testid={testID} />
);
