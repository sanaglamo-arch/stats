"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  METRIC_CATALOG,
  type AggregateTotals,
  type CompetitionType,
  type DerivedMetrics,
  type MetricKey,
} from "@/lib/data";
import { PLAYER_META } from "@/components/card";
import { PLAYER_CLUBS, crestForClub } from "@/components/card/club-crests";
import { competitionLabel, statLabel } from "@/components/card/card-labels";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { Atmosphere } from "@/components/arena/atmosphere";
import type { PlayerProfile, SeasonRow } from "./profile-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * On-mount staggered reveal block (NOT whileInView — its IntersectionObserver
 * doesn't fire under programmatic/headless scroll). Transform+opacity only and a
 * no-op under reduced motion, matching the studio FadeIn convention.
 */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.morph, ease: EASE.out, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

/** Format a metric value through the catalog's decimals/format convention. */
function formatMetric(
  key: MetricKey,
  totals: AggregateTotals,
  derived: DerivedMetrics,
): string {
  const def = METRIC_CATALOG[key];
  const value = metricRaw(key, totals, derived);
  if (value === null) return "—";
  if (def.format === "percent") return `${Math.round(value * 100)}%`;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  });
}

/** Local raw reader — mirrors the data layer's metricValue without re-importing it. */
function metricRaw(
  key: MetricKey,
  totals: AggregateTotals,
  derived: DerivedMetrics,
): number | null {
  switch (key) {
    case "goals":
      return totals.goals;
    case "assists":
      return totals.assists;
    case "matches":
      return totals.matches;
    case "minutes":
      return totals.minutes;
    case "goalsPer90":
      return derived.goalsPer90;
    case "goalContributions":
      return derived.goalContributions;
    case "shotConversion":
      return derived.shotConversion;
    case "xg":
      return totals.xg;
    case "xa":
      return totals.xa;
    case "trophies":
      return totals.trophyCount;
    case "ballonDor":
      return totals.ballonDor;
    default:
      return null;
  }
}

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

export function ProfileView({ profile }: { profile: PlayerProfile }) {
  const { t } = useI18n();
  const meta = PLAYER_META[profile.id];
  const accent = `var(${meta.accentVar})`;
  const clubs = PLAYER_CLUBS[profile.id];
  const otherAwards = profile.totals.individualAwards.filter((a) => !BALLON_DOR.test(a));

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Quieter floodlit atmosphere (DESIGN §6.3 — off-path, dialled down). */}
      <Atmosphere quiet />
      {/* Single-accent aura over the atmosphere, static CSS, decorative. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(60% 50% at 50% -10%, color-mix(in srgb, ${accent} 18%, transparent), transparent 70%)`,
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
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
            style={{
              borderColor: `color-mix(in srgb, ${accent} 42%, var(--color-border-glass))`,
            }}
          >
            <div
              className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-[var(--radius-xl)] sm:mx-0 sm:h-40 sm:w-40"
              style={{
                background: `color-mix(in srgb, ${accent} 16%, var(--color-surface))`,
                boxShadow: `0 0 40px color-mix(in srgb, ${accent} 35%, transparent)`,
              }}
            >
              {/* Plain <img>: assets are SVGs and next/image's SVG optimizer is
                  disabled project-wide (matches the card's PhotoSlot). */}
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

              {/* Career club crests row */}
              <ul className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {clubs.map((club) => {
                  const crest = crestForClub(club);
                  return (
                    <li
                      key={club}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-glass)] bg-[var(--color-surface)] py-1 pl-1 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]"
                    >
                      {crest ? (
                        // light chip so dark/monochrome crests (e.g. Juventus) read
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
        <Section
          title={t.profileCareerTotals}
          hint={t.profileCareerTotalsHint}
          accent={accent}
          delay={0.1}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HEADLINE_METRICS.map((key) => (
              <div key={key} className="glass-panel flex flex-col gap-1 p-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {statLabel(t, key)}
                </span>
                <span
                  className="tabular font-[family-name:var(--font-display)] text-2xl font-black sm:text-3xl"
                  style={{ color: accent }}
                >
                  {formatMetric(key, profile.totals, profile.derived)}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. Season by season ─────────────────────────────────────── */}
        <Section
          title={t.profileBySeason}
          hint={t.profileBySeasonHint}
          accent={accent}
          delay={0.12}
        >
          <SeasonTable seasons={profile.seasons} t={t} accent={accent} />
        </Section>

        {/* ── 4. By competition ───────────────────────────────────────── */}
        <Section
          title={t.profileByCompetition}
          hint={t.profileByCompetitionHint}
          accent={accent}
          delay={0.14}
        >
          <ul className="flex flex-col gap-3">
            {profile.byCompetition.map((row) => (
              <li
                key={row.competition}
                className="glass-panel flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.08em]">
                  {competitionLabel(t, row.competition)}
                </span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <CompStat label={t.statMatches} value={row.totals.matches} />
                  <CompStat label={t.statGoals} value={row.totals.goals} accent={accent} />
                  <CompStat label={t.statAssists} value={row.totals.assists} />
                  <CompStat label={t.statMinutes} value={row.totals.minutes} />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 5. Honours ──────────────────────────────────────────────── */}
        <Section title={t.profileHonours} accent={accent} delay={0.16}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass-panel flex flex-col items-center justify-center gap-1 p-5 text-center">
              <span
                className="tabular font-[family-name:var(--font-display)] text-4xl font-black"
                style={{ color: accent }}
              >
                {profile.totals.trophyCount}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t.profileTeamTrophies}
              </span>
            </div>
            <div className="glass-panel flex flex-col items-center justify-center gap-1 p-5 text-center">
              <span
                className="tabular font-[family-name:var(--font-display)] text-4xl font-black"
                style={{ color: "var(--color-gold)" }}
              >
                {profile.totals.ballonDor}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t.profileBallonDor}
              </span>
            </div>
            <div className="glass-panel flex flex-col items-center justify-center gap-1 p-5 text-center">
              <span
                className="tabular font-[family-name:var(--font-display)] text-4xl font-black"
                style={{ color: accent }}
              >
                {otherAwards.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t.profileIndividualAwards}
              </span>
            </div>
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
        </p>
      </main>
    </div>
  );
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

function CompStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className="tabular font-bold"
        style={accent ? { color: accent } : undefined}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
    </span>
  );
}

const COMP_SHORT: Record<CompetitionType, keyof Dictionary> = {
  league: "compTabLeague",
  champions_league: "compTabChampionsLeague",
  domestic_cup: "compDomesticCup",
  super_cup: "compSuperCup",
  club_world_cup: "compClubWorldCup",
  national_team: "compTabNationalTeam",
};

function SeasonTable({
  seasons,
  t,
  accent,
}: {
  seasons: SeasonRow[];
  t: Dictionary;
  accent: string;
}) {
  return (
    <div className="glass-panel overflow-x-auto p-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">{t.profileBySeason}</caption>
        <thead>
          <tr className="border-b border-[var(--color-border-glass)] text-left text-[0.68rem] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            <th scope="col" className="px-4 py-3 font-semibold">
              {t.profileColSeason}
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {t.profileColClub}
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              {t.profileColComps}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.profileColMatches}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.profileColGoals}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.profileColAssists}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.profileColMinutes}
            </th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((row) => (
            <tr
              key={row.season}
              className="border-b border-[var(--color-border-glass)]/60 last:border-0 transition-colors duration-150 hover:bg-[var(--color-surface)]"
            >
              <th
                scope="row"
                className="tabular whitespace-nowrap px-4 py-2.5 text-left font-bold"
              >
                {row.season}
              </th>
              <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-text-secondary)]">
                {row.club}
              </td>
              <td className="px-4 py-2.5 text-xs text-[var(--color-text-muted)]">
                {row.competitions.map((c) => t[COMP_SHORT[c]]).join(", ")}
              </td>
              <td className="tabular px-4 py-2.5 text-right">{row.totals.matches}</td>
              <td
                className="tabular px-4 py-2.5 text-right font-bold"
                style={{ color: accent }}
              >
                {row.totals.goals}
              </td>
              <td className="tabular px-4 py-2.5 text-right">{row.totals.assists}</td>
              <td className="tabular px-4 py-2.5 text-right text-[var(--color-text-secondary)]">
                {row.totals.minutes.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
