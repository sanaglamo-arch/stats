"use client";

import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { paramsFromSlice, type CardSlice } from "@/components/card";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

const FILENAME = "messi-vs-ronaldo.png";

function cardApiUrl(slice: CardSlice, locale: Locale): string {
  return `/api/card?${paramsFromSlice(slice, locale).toString()}`;
}

/** Fetch the server-rendered PNG as a Blob (throws on non-200). */
async function fetchCardBlob(slice: CardSlice, locale: Locale): Promise<Blob> {
  const res = await fetch(cardApiUrl(slice, locale));
  if (!res.ok) throw new Error(`card render failed: ${res.status}`);
  return res.blob();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type Status = { kind: "idle" } | { kind: "busy"; action: "download" | "share" } | { kind: "error"; message: string } | { kind: "info"; message: string };

export function ShareActions({
  slice,
  locale,
  t,
}: {
  slice: CardSlice;
  locale: Locale;
  t: Dictionary;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = status.kind === "busy";

  async function handleDownload() {
    setStatus({ kind: "busy", action: "download" });
    try {
      const blob = await fetchCardBlob(slice, locale);
      triggerDownload(blob, FILENAME);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", message: t.downloadError });
    }
  }

  async function handleShare() {
    setStatus({ kind: "busy", action: "share" });
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    try {
      const blob = await fetchCardBlob(slice, locale);
      const file = new File([blob], FILENAME, { type: "image/png" });

      // Prefer sharing the PNG file via the Web Share API when supported.
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: t.appName, text: t.tagline, files: [file] });
        setStatus({ kind: "idle" });
        return;
      }

      // Fallback 1: share the page URL (mobile share sheet, no file support).
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: t.appName, text: t.tagline, url: pageUrl });
        setStatus({ kind: "idle" });
        return;
      }

      // Fallback 2: copy the page link to the clipboard.
      await navigator.clipboard.writeText(pageUrl);
      setStatus({ kind: "info", message: t.linkCopied });
    } catch (error) {
      // A user-cancelled share sheet rejects with AbortError — treat as no-op.
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus({ kind: "idle" });
        return;
      }
      try {
        await navigator.clipboard.writeText(pageUrl);
        setStatus({ kind: "info", message: t.shareError });
      } catch {
        setStatus({ kind: "error", message: t.downloadError });
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-sm font-bold uppercase tracking-wide text-[var(--color-bg-base)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${busy ? "" : "cursor-pointer"}`}
          style={{ background: "var(--color-gold)", boxShadow: "var(--shadow-glow-gold)" }}
        >
          {status.kind === "busy" && status.action === "download" ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Download size={18} aria-hidden />
          )}
          {status.kind === "busy" && status.action === "download" ? t.downloading : t.download}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-strong)] px-5 text-sm font-bold uppercase tracking-wide text-[var(--color-text)] transition-all duration-200 hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${busy ? "" : "cursor-pointer"}`}
        >
          {status.kind === "busy" && status.action === "share" ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Share2 size={18} aria-hidden />
          )}
          {t.share}
        </button>
      </div>

      <p
        aria-live="polite"
        className="min-h-[20px] text-center text-sm"
        style={{ color: status.kind === "error" ? "var(--color-messi-bright)" : "var(--color-text-secondary)" }}
      >
        {status.kind === "error" || status.kind === "info" ? status.message : ""}
      </p>
    </div>
  );
}
