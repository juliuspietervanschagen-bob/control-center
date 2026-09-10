import path from "node:path";

export const LOGO_CID = "jrlogo";
export const LOGO_FILENAME = "jr-logo.png";
/** Display size in the email header (asset is a 2x PNG). */
export const LOGO_DISPLAY_WIDTH = 132;
export const LOGO_DISPLAY_HEIGHT = 85;

export function logoFilePath(): string {
  return path.join(process.cwd(), "public", "assets", LOGO_FILENAME);
}

export function logoImgTag(): string {
  return `<img src="cid:${LOGO_CID}" alt="JR Intelligence" width="${LOGO_DISPLAY_WIDTH}" height="${LOGO_DISPLAY_HEIGHT}" style="display:block;margin:0 auto;max-width:${LOGO_DISPLAY_WIDTH}px;height:auto;border:0;outline:none;">`;
}

export function logoAttachment(): {
  filename: string;
  path: string;
  cid: string;
  contentDisposition: "inline";
  contentType: string;
} {
  return {
    filename: LOGO_FILENAME,
    path: logoFilePath(),
    cid: LOGO_CID,
    contentDisposition: "inline",
    contentType: "image/png",
  };
}
