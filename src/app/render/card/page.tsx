import { ComparisonCard } from "@/components/card/comparison-card";
import { CARD_HEIGHT, CARD_WIDTH } from "@/components/card/card-dimensions";
import { buildDefaultCardViewModel } from "@/components/card/card-model";
import { parseLocale, sliceFromParams } from "@/components/card/slice-params";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Headless render target for the PNG pipeline (SPEC §10). Renders the card
 * full-bleed at exactly 1080×1620 with no surrounding chrome, so a Playwright
 * screenshot of the body is a pixel-perfect card. Driven entirely by
 * searchParams via the shared slice-params contract.
 *
 * Not meant for humans to browse directly — the UI embeds the <ComparisonCard>
 * component itself; this page exists purely so the screenshot has a real DOM.
 */
export const dynamic = "force-dynamic";

export default async function RenderCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") params.set(key, value);
  }

  const slice = sliceFromParams(params);
  const locale = parseLocale(params.get("locale"));
  const t = getDictionary(locale);
  const model = buildDefaultCardViewModel(slice);

  return (
    <div
      id="card-root"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, margin: 0, background: "var(--color-bg-base)" }}
    >
      <ComparisonCard model={model} slice={slice} t={t} />
    </div>
  );
}
