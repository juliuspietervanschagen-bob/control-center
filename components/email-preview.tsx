"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { htmlForPreview } from "@/lib/signature";

type EmailPreviewProps = {
  html: string;
  title?: string;
};

export function EmailPreview({ html, title = "Email preview" }: EmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(720);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const srcDoc = htmlForPreview(html, origin);

  const measure = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const next = Math.max(
      doc.documentElement?.scrollHeight ?? 0,
      doc.body?.scrollHeight ?? 0,
      560,
    );
    setHeight(next);
  }, []);

  useEffect(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc?.documentElement) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(doc.documentElement);
    if (doc.body) observer.observe(doc.body);
    return () => observer.disconnect();
  }, [srcDoc, measure]);

  if (!origin) {
    return <div className="min-h-[560px] bg-zinc-50" aria-hidden />;
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <iframe
        ref={iframeRef}
        title={title}
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={srcDoc}
        onLoad={measure}
        style={{ height }}
        className="block w-full border-0 bg-zinc-50"
      />
    </div>
  );
}
