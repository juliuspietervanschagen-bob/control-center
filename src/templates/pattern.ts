/** Seamless 20px tile: 2×2 dots on off-white. Inline data URI — no remote image. */
const TILE_PX = 20;
const DOT_PX = 2;
const BASE = "#fafafa";
const DOT = "#e5e7eb";

export const PATTERN_BASE_COLOR = BASE;
export const CARD_BACKGROUND = "#ffffff";
export const CARD_BORDER = "#f3f4f6";
export const BODY_TEXT_COLOR = "#1f2937";

export function geometricPatternSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_PX}" height="${TILE_PX}" viewBox="0 0 ${TILE_PX} ${TILE_PX}"><rect width="${TILE_PX}" height="${TILE_PX}" fill="${BASE}"/><rect width="${DOT_PX}" height="${DOT_PX}" fill="${DOT}"/></svg>`;
}

export function geometricPatternDataUri(): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(geometricPatternSvg())}`;
}

export function shellBackgroundStyle(): string {
  const uri = geometricPatternDataUri();
  return `background-color:${BASE};background-image:url('${uri}');background-repeat:repeat;background-size:${TILE_PX}px ${TILE_PX}px`;
}
