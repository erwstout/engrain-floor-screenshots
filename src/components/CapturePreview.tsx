export const CapturePreview = ({ url }: { url?: string }) => {
  if (!url) return null;

  return (
    <figure className="preview">
      <img src={url} alt="Latest capture" data-testid="capture-preview" />
      <figcaption className="muted">Latest capture</figcaption>
    </figure>
  );
};
