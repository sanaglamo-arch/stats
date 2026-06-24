"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Download, Link2, Share2, X } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { SHARE_HEIGHT, SHARE_WIDTH } from "./share-dimensions";
import { ShareCard } from "./share-card";
import { buildShareModel } from "./share-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * "Ready to share your verdict?" modal (P9-6). An accessible custom dialog
 * (role=dialog + aria-modal, focus trap, Esc-close, scrim-dismiss, reduced-motion
 * aware) replicating ref3 screen 6. It shows a LIVE preview (the real ShareCard
 * component scaled with a CSS transform — not the PNG), a prefilled caption with
 * hashtags, Copy/Download actions, and a TikTok / X / copy-link share row.
 *
 * `cats` + `showWinner` are passed in from whichever trigger opened it (arena /
 * verdict / cards). The Download button fetches /api/share?... → blob → file.
 */
export function ShareModal({
  open,
  onClose,
  cats,
  showWinner,
}: {
  open: boolean;
  onClose: () => void;
  /** Comma-separated selected category keys (drives the real verdict). */
  cats: string;
  /** Verdict-toggle state — false → neutral card (no winner/score). */
  showWinner: boolean;
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  // Build the REAL share model (same arena-model used everywhere). Deterministic.
  const model = useMemo(() => buildShareModel(cats || null, showWinner), [cats, showWinner]);

  // Default caption (editable). Winner/score substituted from the real model.
  const defaultCaption = useMemo(() => {
    if (model.showWinner && model.winner) {
      const name = PLAYER_META[model.winner].name.split(" ").slice(-1)[0];
      const score = `${model.score.ronaldo}–${model.score.messi}`;
      return t.shareCaptionWinner.replace("{winner}", name).replace("{score}", score);
    }
    return t.shareCaptionNeutral;
  }, [model, t]);

  const [caption, setCaption] = useState(defaultCaption);
  // Re-seed the caption when the underlying selection/locale changes.
  useEffect(() => setCaption(defaultCaption), [defaultCaption]);

  const apiQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (cats) p.set("cats", cats);
    p.set("showWinner", showWinner ? "1" : "0");
    p.set("locale", locale);
    return p.toString();
  }, [cats, showWinner, locale]);

  useEffect(() => setMounted(true), []);

  // Reset transient feedback whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setCaptionCopied(false);
      setLinkCopied(false);
      setDownloadError(false);
    }
  }, [open]);

  // Focus management: trap + restore + Esc close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Focus the panel (or its close button) on open.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  const copyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      window.setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      /* clipboard blocked — silently ignore, the textarea is still selectable */
    }
  }, [caption]);

  const copyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/?share=1&cats=${encodeURIComponent(cats)}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [cats]);

  const download = useCallback(async () => {
    setDownloading(true);
    setDownloadError(false);
    try {
      const res = await fetch(`/api/share?${apiQuery}`);
      if (!res.ok) throw new Error("render failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comparegoats-verdict.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }, [apiQuery]);

  const openX = useCallback(() => {
    const intent = new URL("https://twitter.com/intent/tweet");
    intent.searchParams.set("text", caption);
    window.open(intent.toString(), "_blank", "noopener,noreferrer");
  }, [caption]);

  const openTiktok = useCallback(() => {
    window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
  }, []);

  if (!mounted || !open) return null;

  // Preview scale: fit the 1080-wide card into the ~340px preview column.
  const PREVIEW_WIDTH = 340;
  const scale = PREVIEW_WIDTH / SHARE_WIDTH;

  const overlay = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Scrim — decorative mouse-dismiss affordance. Hidden from the a11y tree
          (aria-hidden + tabIndex -1) so it doesn't duplicate the header X's
          "Close" accessible name; keyboard/SR users dismiss via the X or Esc. */}
      <motion.button
        type="button"
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: DURATION.fast, ease: EASE.out }}
      />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        className="glass-panel relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-xl)] sm:max-h-[88vh]"
        style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-strong)" }}
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: DURATION.base, ease: EASE.out }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-glass)] px-6 py-5">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight text-[var(--color-text)]"
            >
              {t.shareModalTitle}
            </h2>
            <p id={descId} className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t.shareModalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.shareClose}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] ${FOCUS_RING}`}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 overflow-y-auto px-6 py-6 md:grid-cols-[auto_1fr]">
          {/* Live preview */}
          <div className="mx-auto" style={{ width: PREVIEW_WIDTH }}>
            <div
              className="overflow-hidden rounded-[var(--radius-lg)]"
              style={{
                width: PREVIEW_WIDTH,
                height: SHARE_HEIGHT * scale,
                boxShadow: "var(--shadow-glass)",
                border: "1px solid var(--color-border-glass)",
              }}
              role="img"
              aria-label={t.sharePreviewLabel}
            >
              <div
                style={{
                  width: SHARE_WIDTH,
                  height: SHARE_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ShareCard model={model} t={t} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Caption */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${titleId}-caption`}
                className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
              >
                {t.shareCaptionLabel}
              </label>
              <textarea
                id={`${titleId}-caption`}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className={`w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-3.5 py-3 text-sm leading-relaxed text-[var(--color-text)] ${FOCUS_RING}`}
              />
              <button
                type="button"
                onClick={copyCaption}
                className={`inline-flex items-center justify-center gap-2 self-start rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-surface)] ${FOCUS_RING}`}
              >
                {captionCopied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {captionCopied ? t.shareCopied : t.shareCopyCaption}
              </button>
            </div>

            {/* Download */}
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 ${FOCUS_RING}`}
              style={{
                background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
                color: "var(--color-bg-base)",
                boxShadow: "0 8px 28px color-mix(in srgb, var(--color-gold) 38%, transparent)",
              }}
            >
              <Download size={17} aria-hidden />
              {downloading ? t.shareDownloading : t.shareDownload}
            </button>
            {downloadError ? (
              <p role="alert" className="text-xs font-medium text-[var(--color-ronaldo-bright)]">
                {t.shareDownloadError}
              </p>
            ) : null}

            {/* Share row */}
            <div className="flex flex-wrap gap-2">
              <ShareAction icon={<TiktokGlyph />} label={t.shareOpenTiktok} onClick={openTiktok} />
              <ShareAction icon={<Share2 size={16} aria-hidden />} label={t.shareOpenX} onClick={openX} />
              <ShareAction
                icon={linkCopied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
                label={linkCopied ? t.shareLinkCopied : t.shareCopyLink}
                onClick={copyLink}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function ShareAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-surface)] ${FOCUS_RING}`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

/** TikTok note glyph (consistent stroke; no emoji). */
function TiktokGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16.5 3c.3 2.1 1.6 3.7 3.5 4v2.4c-1.3 0-2.5-.4-3.5-1v5.7a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.5a3.1 3.1 0 1 0 2.2 3V3h2.5z" />
    </svg>
  );
}
