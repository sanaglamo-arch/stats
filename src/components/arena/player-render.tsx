"use client";

import { Crosshair } from "lucide-react";
import { PLAYER_META, ageFromDob } from "@/components/card/player-meta";
import type { PlayerId } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import type { ArenaIdentity } from "./arena-model";

/**
 * One side of the Arena: a large duotone player render (gold/red for Ronaldo,
 * blue for Messi) above an identity glass-card (name, flag+nation, position, and
 * a 4-stat strip Age / Height / Foot / Caps). The <img> is plain and static (no
 * RNG/clock) — the duotone is pure CSS (.arena-render*). Numbers come from the
 * model (caps) / static identity facts (height, foot) / computed age (DOB).
 */
export function PlayerRender({
  id,
  identity,
  align,
}: {
  id: PlayerId;
  identity: ArenaIdentity;
  /** Which way the panel leans — left = Ronaldo, right = Messi. */
  align: "left" | "right";
}) {
  const { t } = useI18n();
  const meta = PLAYER_META[id];
  const accent = `var(${meta.accentVar})`;
  const age = ageFromDob(meta.dob);
  const foot = meta.foot === "Left" ? t.arenaFootLeft : t.arenaFootRight;
  const position = id === "messi" ? t.arenaPosPlaymaker : t.arenaPosForward;
  const nationAlt = id === "messi" ? t.flagArgentina : t.flagPortugal;

  const stats: Array<{ label: string; value: string }> = [
    { label: t.arenaAge, value: String(age) },
    { label: t.arenaHeight, value: `${meta.heightCm} ${t.arenaHeightUnit}` },
    { label: t.arenaFoot, value: foot },
    { label: t.arenaCaps, value: String(identity.caps) },
  ];

  const renderSide = align === "left" ? "order-1" : "order-2";

  return (
    <div className={`flex flex-col ${align === "right" ? "lg:items-end" : "lg:items-start"}`}>
      {/* Duotone render */}
      <div
        className={`arena-render arena-render-${id} relative mx-auto h-44 w-44 rounded-[var(--radius-xl)] sm:h-56 sm:w-56 ${renderSide}`}
        style={{ boxShadow: `0 0 60px color-mix(in srgb, ${accent} 38%, transparent)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meta.photoSrc} alt="" aria-hidden draggable={false} />
      </div>

      {/* Identity glass-card */}
      <div
        className="glass-panel mt-4 w-full p-5 sm:p-6"
        style={{ borderColor: `color-mix(in srgb, ${accent} 40%, var(--color-border-glass))` }}
      >
        <h2
          className={`font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl ${align === "right" ? "lg:text-right" : ""}`}
        >
          {meta.name}
        </h2>

        <div
          className={`mt-3 flex flex-col gap-1.5 text-sm text-[var(--color-text-secondary)] ${align === "right" ? "lg:items-end" : ""}`}
        >
          <span className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/flags/${meta.countryCode}.svg`}
              alt={nationAlt}
              width={22}
              height={16}
              className="rounded-[3px]"
            />
            {meta.nationality}
          </span>
          <span className="inline-flex items-center gap-2">
            <Crosshair size={15} aria-hidden style={{ color: accent }} />
            {position}
          </span>
        </div>

        {/* 4-stat strip */}
        <dl className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-border-glass)]">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 bg-[var(--color-bg-elevated)] px-1 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {s.label}
              </dt>
              <dd className="tabular text-base font-bold text-[var(--color-text)]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
