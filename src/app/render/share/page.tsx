import { ShareCard } from "@/components/share/share-card";
import { SHARE_HEIGHT, SHARE_WIDTH } from "@/components/share/share-dimensions";
import { buildShareModel } from "@/components/share/share-model";
import { parseLocale } from "@/components/card/slice-params";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Headless render target for the SHARE-CARD PNG pipeline (P9-6). Renders the
 * share card full-bleed at exactly 1080×1350 with no surrounding chrome (the
 * /render/* routes are chrome-free via AppShell), so a Playwright screenshot of
 * #share-root is a pixel-perfect card. Driven entirely by searchParams:
 *   cats        = comma-separated category keys (validated; falls back to all)
 *   showWinner  = "0" → neutral card (no winner/score), anything else → ON
 *   locale      = "en" | "ru"
 *
 * This is ADDITIVE to /render/card — the existing card path is untouched.
 */
export const dynamic = "force-dynamic";

export default async function RenderSharePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const get = (key: string): string | null => {
    const value = resolved[key];
    return typeof value === "string" ? value : null;
  };

  const showWinner = get("showWinner") !== "0";
  const locale = parseLocale(get("locale"));
  const t = getDictionary(locale);
  const model = buildShareModel(get("cats"), showWinner);

  return (
    <div style={{ width: SHARE_WIDTH, height: SHARE_HEIGHT, margin: 0, background: "var(--color-bg-base)" }}>
      <ShareCard model={model} t={t} />
    </div>
  );
}
