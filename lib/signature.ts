import path from "node:path";

export const SIGNATURE_CID = "jrsignature";
export const SIGNATURE_FILENAME = "image_029d84.jpg";

export function signatureFilePath(): string {
  return path.join(process.cwd(), "public", "assets", SIGNATURE_FILENAME);
}

export function signatureImgTag(): string {
  return `<img src="cid:${SIGNATURE_CID}" alt="JR Signature" width="120" style="display:block;margin-top:10px;max-width:120px;height:auto;border:0;outline:none;">`;
}

export function signatureBlock(language: "en" | "nl"): string {
  const regards = language === "nl" ? "Met vriendelijke groet," : "Best regards,";
  return `<p class="signoff">${regards}<br><br>Rik &amp; Julius<br>JR Intelligence</p>
${signatureImgTag()}`;
}

export function signatureAttachment(): {
  filename: string;
  path: string;
  cid: string;
  contentDisposition: "inline";
  contentType: string;
} {
  return {
    filename: SIGNATURE_FILENAME,
    path: signatureFilePath(),
    cid: SIGNATURE_CID,
    contentDisposition: "inline",
    contentType: "image/jpeg",
  };
}

export function htmlForPreview(html: string, origin = ""): string {
  const src = origin
    ? `${origin.replace(/\/+$/, "")}/assets/${SIGNATURE_FILENAME}`
    : `/assets/${SIGNATURE_FILENAME}`;
  return html.replaceAll(`cid:${SIGNATURE_CID}`, src);
}
