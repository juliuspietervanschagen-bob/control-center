import path from "node:path";

export const LOGO_CID = "jrlogo";
export const LOGO_FILENAME = "jr-logo.png";

export function logoFilePath(): string {
  return path.join(process.cwd(), "public", "assets", LOGO_FILENAME);
}

export function logoImgTag(): string {
  return `<img src="cid:${LOGO_CID}" alt="JR Intelligence" width="180" height="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;outline:none;">`;
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
