/**
 * Player photo slot (SPEC §8). Accepts a replaceable `src` so a licensed photo
 * can drop in later without touching the card layout. MVP ships stylized neon
 * silhouette placeholders (see public/players/*.svg) — NOT real copyrighted
 * photos. Photo-rights are a documented before-launch TODO (DATA_REPORT.md §8).
 *
 * Plain <img> on purpose: this component is also rendered headless by the PNG
 * route, where next/image's optimizer/runtime adds no value and only friction.
 */
export function PhotoSlot({
  src,
  alt,
  accentVar,
}: {
  src: string;
  alt: string;
  accentVar: string;
}) {
  return (
    <div
      className="relative flex aspect-square w-full items-end justify-center overflow-hidden rounded-[var(--radius-lg)]"
      style={{
        background: `radial-gradient(120% 90% at 50% 10%, color-mix(in srgb, var(${accentVar}) 28%, transparent), transparent 70%)`,
        border: `1px solid color-mix(in srgb, var(${accentVar}) 45%, transparent)`,
        boxShadow: `inset 0 0 40px color-mix(in srgb, var(${accentVar}) 22%, transparent)`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- headless-rendered, see note above */}
      <img src={src} alt={alt} className="h-full w-full object-contain" draggable={false} />
    </div>
  );
}
