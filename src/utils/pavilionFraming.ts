/** Fit the fixed gallery bays into a narrow viewport while staying on the carpet. */
export function pavilionFraming(width: number, height: number, fieldOfView: number, emblemSize = 2.4, emblemHeight = 4.35) {
  const aspect = Math.max(.3, Math.min(4, width / Math.max(1, height)));
  const portrait = Math.max(0, Math.min(1, (1.25 - aspect) / .7));
  const lateralStep = portrait * 2.15; // Inside the carpet's 2.325-unit half-width.
  const frameViewWidth = 6.8;
  const compact = width <= 900 || height <= 600;
  const landscapeFOV = height <= 600 && width > height ? 68 : fieldOfView;
  const photoFOV = Math.min(84, Math.max(landscapeFOV, 2 * Math.atan(frameViewWidth / (2 * (6.45 + lateralStep) * aspect)) * 180 / Math.PI));
  const finaleViewWidth = 2 * Math.tan(fieldOfView * Math.PI / 360) * 5 * aspect;
  const emblemViewHeight = 2 * Math.tan(fieldOfView * Math.PI / 360) * 4.5;
  const emblemFraction = Math.min(.38, Math.max(.18, (height - 180) / height * .48));
  const emblemScale = Math.min(1, finaleViewWidth * .76 / emblemSize, compact ? emblemViewHeight * emblemFraction / emblemSize : 1);
  const emblemScreenHeight = emblemSize * emblemScale / emblemViewHeight;
  const emblemScreenCentre = (height <= 600 ? 108 : 132) / height + emblemScreenHeight / 2;
  return {
    portrait,
    lateralStep,
    photoFOV,
    iconFOV: Math.min(78, fieldOfView + portrait * 8),
    emblemScale,
    emblemOffsetY: compact ? 3.5 + (.5 - emblemScreenCentre) * emblemViewHeight - emblemHeight : 0,
    finaleTextWidth: Math.min(1800, finaleViewWidth * .82 / 14.4 * 2048),
  };
}
