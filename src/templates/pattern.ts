/** Email-only 45° line hatch. Never use this in Next.js dashboard chrome. */
export const PATTERN_TILE_PX = 24;
export const PATTERN_BASE_COLOR = "#fafafa";
export const PATTERN_LINE_COLOR = "#d1d5db";
export const PATTERN_LINE_SOFT = "#e5e7eb";
export const CARD_BACKGROUND = "#ffffff";
export const CARD_BORDER = "#f3f4f6";
export const BODY_TEXT_COLOR = "#1f2937";

export const LINE_PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${PATTERN_TILE_PX}" height="${PATTERN_TILE_PX}" viewBox="0 0 ${PATTERN_TILE_PX} ${PATTERN_TILE_PX}"><rect width="${PATTERN_TILE_PX}" height="${PATTERN_TILE_PX}" fill="${PATTERN_BASE_COLOR}"/><path d="M-4 4 L4 -4 M0 ${PATTERN_TILE_PX} L${PATTERN_TILE_PX} 0 M${PATTERN_TILE_PX - 4} ${PATTERN_TILE_PX + 4} L${PATTERN_TILE_PX + 4} ${PATTERN_TILE_PX - 4}" stroke="${PATTERN_LINE_SOFT}" stroke-width="1" fill="none"/><path d="M-4 ${PATTERN_TILE_PX - 4} L4 ${PATTERN_TILE_PX + 4} M0 0 L${PATTERN_TILE_PX} ${PATTERN_TILE_PX} M${PATTERN_TILE_PX - 4} -4 L${PATTERN_TILE_PX + 4} 4" stroke="${PATTERN_LINE_COLOR}" stroke-width="0.85" fill="none"/></svg>`;

export function geometricPatternDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(LINE_PATTERN_SVG).toString("base64")}`;
}

export function shellBackgroundStyle(): string {
  const uri = geometricPatternDataUri();
  return `background-color:${PATTERN_BASE_COLOR};background-image:url('${uri}');background-repeat:repeat;background-size:${PATTERN_TILE_PX}px ${PATTERN_TILE_PX}px`;
}
