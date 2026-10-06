import { forwardRef } from "react";
import { STAGE_SIZE_PX } from "../capture/captureFloor";

export const CAPTURE_STAGE_ID = "capture-stage";

// The wrapper sits offscreen; the captured inner node carries no offset styles into the snapshot.
export const CaptureStage = forwardRef<HTMLDivElement>((_, ref) => (
  <div aria-hidden style={{ position: "fixed", left: -99999, top: 0 }}>
    <div
      ref={ref}
      id={CAPTURE_STAGE_ID}
      data-testid="capture-stage"
      style={{ width: STAGE_SIZE_PX, height: STAGE_SIZE_PX, background: "#fff" }}
    />
  </div>
));
