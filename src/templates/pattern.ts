export function geometricPatternDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="3" cy="3" r="1" fill="#f4f4f5"/>
  <circle cx="15" cy="15" r="1" fill="#f4f4f5"/>
  <path d="M0 24 L24 0" stroke="#f4f4f5" stroke-width="0.6" fill="none"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
