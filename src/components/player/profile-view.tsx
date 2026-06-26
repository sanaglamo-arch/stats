"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  METRIC_CATALOG,
  datasetGeneratedAt,
  metricValue,
  type AggregateTotals,
  type DerivedMetrics,
  type MetricKey,
  type PlayerSeasonComp,
} from "@/lib/data";
import { PLAYER_META } from "@/components/card";
import { PLAYER_CLUBS, crestForClub } from "@/components/card/club-crests";
import { statLabel } from "@/components/card/card-labels";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { Atmosphere } from "@/components/arena/atmosphere";
import { CountUp, Reveal, TabTransition } from "@/components/motion";
import {
  CompetitionTabs,
  type CompetitionContext,
} from "@/components/studio/competition-tabs";
import {
  Field,
  SegmentedControl,
  FOCUS_RING,
} from "@/components/studio/control-primitives";
import { COMPARE_COLUMNS } from "@/components/compare/compare-model";
import {
  buildSeasonStatTable,
  type AgePoint,
  type LeagueRow,
  type PlayerProfile,
  type ProfileContext,
} from "./profile-model";
import { SeasonStatTable } from "./season-stat-table";

/**
 * Full single-player stat page (Phase 11 p11-5). Hero (header + career totals) →
 * full season × competition table (all catalog metrics, Core/Advanced, per-season
 * expandable to the 34 `competitionName` rows) → Shooting & xG → Discipline →
 * age-progression → by-league → honours → provenance.
 *
 * READ-ONLY evidence, single-accent calm treatment (off the arena's hot path).
 * Every number comes from the data layer via selectors — nothing fabricated;
 * «н/д» (xG/xA pre-2014, forced cards) is never a 0.
 */

const HEADLINE_METRICS: MetricKey[] = [
  "goals",
  "assists",
  "goalContributions",
  "matches",
  "minutes",
  "goalsPer90",
  "trophies",
  "ballonDor",
];

const BALLON_DOR = /ballon\s*d['’]or/i;

/** Build a catalog-aware formatter for a metric value (locale-grouped). */
function metricFormat(key: MetricKey, locale: Locale): (n: number) => string {
  const def = METRIC_CATALOG[key];
  const nf = locale === "ru" ? "ru-RU" : "en-US";
  return (n: number) => {
    if (def.format === "percent") return `${(n * 100).toFixed(def.decimals)}%`;
    if (def.decimals > 0) return n.toFixed(def.decimals);
    return Math.round(n).toLocaleString(nf);
  };
}

export function ProfileView({
  profile,
  rows,
}: {
  profile: PlayerProfile;
  rows: PlayerSeasonComp[];
}) {
  const { t, locale } = useI18n();
  const meta = PLAYER_META[profile.id];
  const accent = `var(${meta.accentVar})`;
  const clubs = PLAYER_CLUBS[profile.id];
  const otherAwards = profile.totals.individualAwards.filter((a) => !BALLON_DOR.test(a));

  const [context, setContext] = useState<ProfileContext>("all");
  const [tier, setTier] = useState<"core" | "advanced">("core");

  const tableModel = useMemo(
    () => buildSeasonStatTable(rows, profile.id, context),
    [rows, profile.id, context],
  );
  const visibleColumns = useMemo(
    () => (tier === "advanced" ? COMPARE_COLUMNS : COMPARE_COLUMNS.filter((c) => c.tier === "core")),
    [tier],
  );

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Quieter, SINGLE-accent atmosphere (DESIGN §6.3 — off-path, dialled down). */}
      <Atmosphere quiet side={profile.id} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(60% 50% at 50% -10%, color-mix(in srgb, ${accent} 18%, transparent), transparent 70%)`,
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <Reveal>
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-full border border-[var(--color-border-glass)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
          >
            <ArrowLeft size={16} aria-hidden />
            {t.verdictBackToArena}
          </Link>
        </Reveal>

        {/* ── 1. Profile header ───────────────────────────────────────── */}
        <Reveal delay={0.05}>
          <header
            className="glass-panel mt-6 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
            style={{ borderColor: `color-mix(in srgb, ${accent} 42%, var(--color-border-glass))` }}
          >
            <div
              className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-[var(--radius-xl)] sm:mx-0 sm:h-40 sm:w-40"
              style={{
                background: `color-mix(in srgb, ${accent} 16%, var(--color-surface))`,
                boxShadow: `0 0 40px color-mix(in srgb, ${accent} 35%, transparent)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.photoSrc}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-contain p-2"
              />
            </div>

            <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <span
                className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.36em]"
                style={{ color: accent }}
              >
                {t.profileKicker}
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-tight sm:text-5xl">
                {meta.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-secondary)] sm:justify-start">
                <span className="inline-flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/flags/${meta.countryCode}.svg`}
                    alt={`${meta.nationality} flag`}
                    width={22}
                    height={16}
                    className="rounded-[3px]"
                  />
                  {meta.nationality}
                </span>
                <span>{meta.position}</span>
                <span className="tabular">
                  {profile.firstSeason} – {profile.lastSeason}
                </span>
              </div>

              <ul className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {clubs.map((club) => {
                  const crest = crestForClub(club);
                  return (
                    <li
                      key={club}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-glass)] bg-[var(--color-surface)] py-1 pl-1 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]"
                    >
                      {crest ? (
                        <span
                          aria-hidden
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "rgba(255,255,255,0.94)" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={crest} alt="" width={16} height={16} className="object-contain" />
                        </span>
                      ) : (
                        <span aria-hidden className="h-5 w-5" />
                      )}
                      {club}
                    </li>
                  );
                })}
              </ul>
            </div>
          </header>
        </Reveal>

        {/* ── 2. Career totals ────────────────────────────────────────── */}
        <Section title={t.profileCareerTotals} hint={t.profileCareerTotalsHint} accent={accent} delay={0.1}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HEADLINE_METRICS.map((key) => {
              const value = metricValue(key, profile.totals, profile.derived);
              return (
                <div key={key} className="glass-panel flex flex-col gap-1 p-4">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {statLabel(t, key)}
                  </span>
                  <span
                    className="tabular font-[family-name:var(--font-display)] text-2xl font-black sm:text-3xl"
                    style={{ color: accent }}
                  >
                    {value === null ? (
                      t.statsNa
                    ) : (
                      <CountUp value={value} format={metricFormat(key, locale)} />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 3. Full season × competition table ──────────────────────── */}
        <Section title={t.profileFullStats} hint={t.profileFullStatsHint} accent={accent} delay={0.12}>
          <div className="mb-4 flex flex-col gap-4">
            <Field label={t.statsTierLabel} htmlFor="profile-tier">
              <div className="max-w-xs">
                <SegmentedControl
                  id="profile-tier"
                  ariaLabel={t.statsTierLabel}
                  value={tier}
                  accent={accent}
                  onChange={setTier}
                  items={[
                    { value: "core", label: t.statsTierCore },
                    { value: "advanced", label: t.statsTierAdvanced },
                  ]}
                />
              </div>
            </Field>
            <CompetitionTabs
              value={context as CompetitionContext}
              t={t}
              onChange={(next) => setContext(next as ProfileContext)}
            />
          </div>
          <TabTransition id={`${context}:${tier}`}>
            <SeasonStatTable
              model={tableModel}
              columns={visibleColumns}
              t={t}
              locale={locale}
              accent={accent}
            />
          </TabTransition>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">{t.profileExpandHint}</p>
        </Section>

        {/* ── 4. Shooting & xG ────────────────────────────────────────── */}
        <Section title={t.profileShooting} hint={t.profileShootingHint} accent={accent} delay={0.13}>
          <ShootingBlock totals={profile.totals} derived={profile.derived} t={t} locale={locale} accent={accent} />
        </Section>

        {/* ── 5. Discipline ───────────────────────────────────────────── */}
        <Section title={t.profileDiscipline} hint={t.profileDisciplineHint} accent={accent} delay={0.14}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["statYellowCards", "statRedCards"] as const).map((labelKey) => (
              <div key={labelKey} className="glass-panel flex items-center justify-between gap-3 p-5">
                <span className="text-sm font-semibold text-[var(--color-text-secondary)]">{t[labelKey]}</span>
                <span className="inline-flex items-center gap-2">
                  <span className="tabular font-[family-name:var(--font-display)] text-2xl font-black text-[var(--color-text-muted)]">
                    {t.statsNa}
                  </span>
                  <span className="rounded-[4px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1.5 py-px text-[0.6rem] font-bold text-[var(--color-gold)]">
                    {t.statsBadgeMissing}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">{t.profileDisciplineNote}</p>
        </Section>

        {/* ── 6. Age progression ──────────────────────────────────────── */}
        <Section title={t.profileAgeProgression} hint={t.profileAgeProgressionHint} accent={accent} delay={0.15}>
          <div className="glass-panel p-5 sm:p-6">
            <AgeBars points={profile.ageProgression} t={t} accent={accent} locale={locale} />
          </div>
        </Section>

        {/* ── 7. By league ────────────────────────────────────────────── */}
        {profile.byLeague.length > 0 && (
          <Section title={t.profileByLeague} hint={t.profileByLeagueHint} accent={accent} delay={0.16}>
            <ByLeague rows={profile.byLeague} t={t} accent={accent} locale={locale} />
          </Section>
        )}

        {/* ── 8. Honours ──────────────────────────────────────────────── */}
        <Section title={t.profileHonours} accent={accent} delay={0.17}>
          <div className="grid gap-3 sm:grid-cols-3">
            <HonourTile value={profile.totals.trophyCount} label={t.profileTeamTrophies} color={accent} />
            <HonourTile value={profile.totals.ballonDor} label={t.profileBallonDor} color="var(--color-gold)" />
            <HonourTile value={otherAwards.length} label={t.profileIndividualAwards} color={accent} />
          </div>

          <div className="mt-4 grid items-start gap-4 sm:grid-cols-2">
            <div className="glass-panel p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t.profileTeamTrophies}
              </h3>
              {profile.totals.trophies.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {profile.totals.trophies.map((trophy) => (
                    <li
                      key={trophy}
                      className="rounded-full border border-[var(--color-border-glass)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
                    >
                      {trophy}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{t.profileNoTrophies}</p>
              )}
            </div>
            <div className="glass-panel p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t.profileIndividualAwards}
              </h3>
              {profile.totals.ballonDor > 0 || otherAwards.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {profile.totals.ballonDor > 0 ? (
                    <li
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        borderColor: "color-mix(in srgb, var(--color-gold) 55%, transparent)",
                        background: "color-mix(in srgb, var(--color-gold) 12%, transparent)",
                        color: "var(--color-gold)",
                      }}
                    >
                      {t.profileBallonDor} ×{profile.totals.ballonDor}
                    </li>
                  ) : null}
                  {otherAwards.map((award) => (
                    <li
                      key={award}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        borderColor: `color-mix(in srgb, ${accent} 40%, var(--color-border-glass))`,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {award}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{t.profileNoAwards}</p>
              )}
            </div>
          </div>
        </Section>

        <p className="mt-10 text-center text-xs text-[var(--color-text-muted)]">
          {t.profileUnverified}
          <span className="mx-1.5 text-[var(--color-border-strong)]">·</span>
          {t.profileAsOf.replace("{date}", formatDate(datasetGeneratedAt, locale))}
        </p>
      </main>
    </div>
  );
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Section({
  title,
  hint,
  accent,
  delay,
  children,
}: {
  title: string;
  hint?: string;
  accent: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay} className="mt-10">
      <section>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-black uppercase tracking-tight sm:text-xl">
            <span
              aria-hidden
              className="h-4 w-1 rounded-full"
              style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
            />
            {title}
          </h2>
          {hint && <p className="text-sm text-[var(--color-text-muted)]">{hint}</p>}
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function HonourTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center gap-1 p-5 text-center">
      <span className="tabular font-[family-name:var(--font-display)] text-4xl font-black" style={{ color }}>
        <CountUp value={value} format={(n) => String(Math.round(n))} />
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}

/** ── Shooting & xG block (wireframe C) ────────────────────────────────── */

function ShootingBlock({
  totals,
  derived,
  t,
  locale,
  accent,
}: {
  totals: AggregateTotals;
  derived: DerivedMetrics;
  t: Dictionary;
  locale: Locale;
  accent: string;
}) {
  const nf = (n: number) => n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  type Tile = { labelKey: keyof Dictionary; text: string; modern?: boolean; muted?: boolean };
  const tiles: Tile[] = [
    { labelKey: "statShots", text: nf(totals.shots) },
    { labelKey: "statShotsOnTarget", text: nf(totals.shotsOnTarget) },
    { labelKey: "statShotConversion", text: pct(derived.shotConversion) },
    { labelKey: "statShotsOnTargetPct", text: pct(derived.shotsOnTargetPct) },
    { labelKey: "statXg", text: totals.xg === null ? t.statsNa : totals.xg.toFixed(1), modern: true, muted: totals.xg === null },
    { labelKey: "statXa", text: totals.xa === null ? t.statsNa : totals.xa.toFixed(1), modern: true, muted: totals.xa === null },
    {
      labelKey: "statXgPerformance",
      text:
        derived.xgPerformance === null
          ? t.statsNa
          : `${derived.xgPerformance > 0 ? "+" : ""}${derived.xgPerformance.toFixed(1)}`,
      modern: true,
      muted: derived.xgPerformance === null,
    },
    { labelKey: "statPenaltyGoals", text: nf(totals.penaltyGoals) },
    { labelKey: "statPenaltyPct", text: pct(derived.penaltyPct) },
    { labelKey: "statFreekickGoals", text: nf(totals.freekickGoals) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.labelKey} className="glass-panel flex flex-col gap-1 p-4">
            <span className="inline-flex items-center gap-1 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {t[tile.labelKey]}
              {tile.modern && (
                <span title={t.statsBadge2014} aria-label={t.statsBadge2014} className="text-[0.6rem] text-[var(--color-gold)]">
                  ⓘ
                </span>
              )}
            </span>
            <span
              className="tabular font-[family-name:var(--font-display)] text-xl font-black sm:text-2xl"
              style={{ color: tile.muted ? "var(--color-text-muted)" : accent }}
            >
              {tile.text}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">{t.profileXgNote}</p>
    </>
  );
}

/** ── Age-progression strip (G / G+A by age) ──────────────────────────── */

const AGE_W = 720;
const AGE_H = 220;
const AGE_PAD = { top: 12, right: 12, bottom: 30, left: 34 };
const AGE_PLOT_W = AGE_W - AGE_PAD.left - AGE_PAD.right;
const AGE_PLOT_H = AGE_H - AGE_PAD.top - AGE_PAD.bottom;

function AgeBars({
  points,
  t,
  accent,
  locale,
}: {
  points: AgePoint[];
  t: Dictionary;
  accent: string;
  locale: Locale;
}) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">{t.chartNoData}</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.ga));
  const n = points.length;
  const slot = AGE_PLOT_W / n;
  const barW = Math.min(22, slot * 0.62);
  const labelEvery = Math.max(1, Math.ceil(n / 12));
  const gaLabel = t.statsColGA;
  const gLabel = statLabel(t, "goals");

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{t.profileAgeProgression}</h3>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: accent }} />
            {gLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ background: `color-mix(in srgb, ${accent} 32%, transparent)` }}
            />
            {gaLabel}
          </span>
        </div>
      </figcaption>

      <svg
        viewBox={`0 0 ${AGE_W} ${AGE_H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${t.profileAgeProgression} — ${gLabel} / ${gaLabel}`}
      >
        {[0, 0.5, 1].map((f) => {
          const y = AGE_PAD.top + AGE_PLOT_H - f * AGE_PLOT_H;
          return (
            <g key={f}>
              <line x1={AGE_PAD.left} y1={y} x2={AGE_W - AGE_PAD.right} y2={y} stroke="var(--color-border-glass)" strokeWidth="1" />
              <text x={AGE_PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--color-text-muted)">
                {Math.round(max * f)}
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const cx = AGE_PAD.left + i * slot + slot / 2;
          const x = cx - barW / 2;
          const gaH = (p.ga / max) * AGE_PLOT_H;
          const gH = (p.goals / max) * AGE_PLOT_H;
          const showLabel = i % labelEvery === 0 || i === n - 1;
          return (
            <g key={p.age}>
              <title>{`${t.cmpColAge} ${p.age} · ${gLabel} ${p.goals} · ${gaLabel} ${p.ga}`}</title>
              <rect
                x={x}
                y={AGE_PAD.top + AGE_PLOT_H - gaH}
                width={barW}
                height={gaH}
                rx="2"
                fill={`color-mix(in srgb, ${accent} 28%, transparent)`}
              />
              <rect
                x={x}
                y={AGE_PAD.top + AGE_PLOT_H - gH}
                width={barW}
                height={gH}
                rx="2"
                fill={accent}
              />
              {showLabel && (
                <text x={cx} y={AGE_H - AGE_PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
                  {p.age}
                </text>
              )}
            </g>
          );
        })}
        <text x={AGE_PAD.left + AGE_PLOT_W / 2} y={AGE_H - 3} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
          {t.cmpColAge}
        </text>
      </svg>

      {/* a11y data fallback */}
      <table className="sr-only">
        <caption>{t.profileAgeProgression}</caption>
        <thead>
          <tr>
            <th scope="col">{t.cmpColAge}</th>
            <th scope="col">{gLabel}</th>
            <th scope="col">{gaLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.age}>
              <th scope="row">{p.age}</th>
              <td>{p.goals.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</td>
              <td>{p.ga.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** ── By-league strip (real leagues only) ─────────────────────────────── */

function ByLeague({
  rows,
  t,
  accent,
  locale,
}: {
  rows: LeagueRow[];
  t: Dictionary;
  accent: string;
  locale: Locale;
}) {
  const nf = (n: number) => n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
  const max = Math.max(1, ...rows.map((r) => r.goals));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.labelKey} className="glass-panel flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.08em]">
              {t[row.labelKey]}
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="inline-flex items-baseline gap-1.5">
                <span className="tabular font-black" style={{ color: accent }}>{nf(row.goals)}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t.profileColGoals}</span>
              </span>
              <span className="inline-flex items-baseline gap-1.5">
                <span className="tabular font-bold">{nf(row.assists)}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t.profileColAssists}</span>
              </span>
              <span className="inline-flex items-baseline gap-1.5">
                <span className="tabular font-semibold text-[var(--color-text-secondary)]">{nf(row.matches)}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{t.profileColMatches}</span>
              </span>
            </div>
          </div>
          <div
            aria-hidden
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: "var(--color-surface-strong)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${(row.goals / max) * 100}%`, background: accent }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
