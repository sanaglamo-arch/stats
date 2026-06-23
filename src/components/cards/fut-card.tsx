"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PLAYER_META } from "@/components/card/player-meta";
import type { PlayerId } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { FIFA_RATINGS, FUT_FACE_STATS, type FifaStatKey } from "./fifa-ratings";

/**
 * A premium FUT-style collectible card (P9-5). Ronaldo = RED, Messi = BLUE, gold
 * trim. The angular card silhouette is a CSS `clip-path` octagon; the surface is
 * a layered side-tint gradient + a gold gloss sweep. Content (overall rating +
 * position top-left, duotone player render, name plate, the 6 FUT face stats
 * PAC/SHO/PAS/DRI/DEF/PHY + a CLUTCH chip, and a nation/club strip) is laid over
 * the shape. Static — transform/opacity entrance only, no RNG/clock.
 *
 * ALL numbers on this card are the FIFA-style COSMETIC ratings from
 * `fifa-ratings.ts`, NOT real Phase-8 stats — see the caption rendered by the
 * `/cards` page. The real comparison lives in the detail panel below the cards.
 */

const STAT_LABELS: Record<FifaStatKey, keyof Dictionary> = {
  pac: "futStatPac",
  sho: "futStatSho",
  pas: "futStatPas",
  dri: "futStatDri",
  def: "futStatDef",
  phy: "futStatPhy",
  clutch: "futStatClutch",
};

export function FutCard({
  id,
  align,
  delay = 0,
}: {
  id: PlayerId;
  /** Which way the card leans — left = Ronaldo, right = Messi (mirrors layout). */
  align: "left" | "right";
  delay?: number;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const meta = PLAYER_META[id];
  const rating = FIFA_RATINGS[id];
  const accent = `var(${meta.accentVar})`;
  const accentBright = `var(${meta.accentVar}-bright)`;
  const nationAlt = id === "messi" ? t.flagArgentina : t.flagPortugal;
  const position = t.arenaPosForward;

  // Side-tinted card surface: deep accent → near-black, with a gold edge sheen.
  const surface =
    id === "ronaldo"
      ? "linear-gradient(155deg, #4a0613 0%, #7a0d22 32%, #2b0a14 72%, #16060c 100%)"
      : "linear-gradient(155deg, #06183f 0%, #0d3a7a 32%, #0a1c3a 72%, #060f22 100%)";

  return (
    <motion.div
      className={`fut-card-wrap relative mx-auto w-full max-w-[20rem] ${align === "right" ? "lg:ml-auto" : "lg:mr-auto"}`}
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
      animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE.out, delay }}
    >
      {/* Accent halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          filter: "blur(38px)",
          background: `radial-gradient(60% 55% at 50% 38%, color-mix(in srgb, ${accent} 55%, transparent), transparent 72%)`,
        }}
      />

      {/* Gold trim — slightly larger clip behind the surface acts as a border */}
      <div className="fut-card-shape relative p-[3px]" style={{ background: "linear-gradient(160deg, var(--color-gold-bright), var(--color-gold) 46%, #8a5a12 100%)" }}>
        <div
          className="fut-card-shape relative overflow-hidden"
          style={{ background: surface }}
        >
          {/* Gloss sweep */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(118deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 36%), radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.14), transparent 60%)",
            }}
          />

          <div className="relative flex flex-col px-5 pb-5 pt-6">
            {/* Top row: rating block (left) + duotone render (right) */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col items-center">
                <span
                  className="font-[family-name:var(--font-display)] text-5xl font-black leading-[0.8] tabular-nums"
                  style={{ color: "var(--color-gold-bright)", textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
                >
                  {rating.overall}
                </span>
                <span className="mt-0.5 font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[0.15em] text-[var(--color-gold)]">
                  {rating.position}
                </span>
                <span className="my-1.5 h-px w-7" style={{ background: "color-mix(in srgb, var(--color-gold) 60%, transparent)" }} aria-hidden />
                {/* Nation flag + a crest-style dot, stacked under the rating (FUT chrome) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/flags/${meta.countryCode}.svg`}
                  alt={nationAlt}
                  width={26}
                  height={18}
                  className="rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Duotone player render */}
              <div
                className={`fut-render fut-render-${id} relative -mt-2 -mr-1 h-40 w-32 shrink-0 sm:h-44`}
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.photoSrc} alt="" draggable={false} />
              </div>
            </div>

            {/* Name plate */}
            <div className="mt-1 text-center">
              <h2
                className="font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight text-white"
                style={{ textShadow: `0 2px 12px color-mix(in srgb, ${accentBright} 60%, rgba(0,0,0,0.6))` }}
              >
                {meta.name}
              </h2>
              <div
                className="mx-auto mt-2 h-px w-4/5"
                style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-gold) 70%, transparent), transparent)" }}
                aria-hidden
              />
            </div>

            {/* 6 FUT face stats: two columns of 3 (PAC SHO PAS | DRI DEF PHY) */}
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 px-2">
              {FUT_FACE_STATS.map((key, i) => (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-2 ${i % 2 === 0 ? "justify-self-start" : "justify-self-end"} w-full`}
                >
                  <dd
                    className="tabular text-lg font-black tabular-nums text-white"
                    aria-label={`${t[STAT_LABELS[key]]} ${rating.stats[key]}`}
                  >
                    {rating.stats[key]}
                  </dd>
                  <dt className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-gold)]">
                    {t[STAT_LABELS[key]]}
                  </dt>
                </div>
              ))}
            </dl>

            {/* CLUTCH chip — the signature flourish stat, set apart */}
            <div
              className="mx-auto mt-3 inline-flex items-center gap-2 self-center rounded-full px-3.5 py-1"
              style={{
                background: "color-mix(in srgb, var(--color-gold) 18%, rgba(0,0,0,0.35))",
                border: "1px solid color-mix(in srgb, var(--color-gold) 55%, transparent)",
              }}
            >
              <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold-bright)]">
                {t.futStatClutch}
              </span>
              <span
                className="tabular text-base font-black tabular-nums text-white"
                aria-label={`${t.futStatClutch} ${rating.stats.clutch}`}
              >
                {rating.stats.clutch}
              </span>
            </div>

            {/* Nation / position strip */}
            <div
              className="mt-3 flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-center"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid color-mix(in srgb, var(--color-gold) 28%, transparent)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/flags/${meta.countryCode}.svg`} alt="" aria-hidden width={20} height={14} className="rounded-[2px]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                {meta.nationality} · {position}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
