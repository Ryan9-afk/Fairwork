"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function PdfPagePreview({ url, pages }: { url: string; pages: number }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Loading page…");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    async function render() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ url });
        destroy = () => { void task.destroy(); };
        const document = await task.promise;
        const sheet = await document.getPage(page);
        if (cancelled || !canvas.current) return;
        const viewport = sheet.getViewport({ scale: 1.5 });
        const element = canvas.current;
        element.width = viewport.width;
        element.height = viewport.height;
        await sheet.render({ canvas: element, viewport }).promise;
        if (!cancelled) setStatus("");
      } catch {
        if (!cancelled) setStatus("Preview unavailable. Use the save link above to view every page in your PDF reader.");
      }
    }
    void render();
    return () => { cancelled = true; destroy?.(); };
  }, [url, page]);
  return <div className="pdf-pages">
    <nav aria-label="PDF pages">
      <Button variant="iosTinted" disabled={page === 1} onClick={() => { setStatus("Loading page…"); setPage(page - 1); }}>Previous</Button>
      <span aria-live="polite">Page {page} of {pages}</span>
      <Button variant="iosTinted" disabled={page === pages} onClick={() => { setStatus("Loading page…"); setPage(page + 1); }}>Next</Button>
    </nav>
    {status && <p role="status">{status}</p>}
    <canvas ref={canvas} role="img" aria-label={`Dossier page ${page} of ${pages}. Full text is available in the dossier above and downloaded PDF.`} />
  </div>;
}
