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
        background:
          `radial-gradient(125% 95% at 50% 8%, color-mix(in srgb, var(${accentVar}) 32%, transparent), transparent 68%),` +
          "linear-gradient(180deg, rgba(255,255,255,0.05), transparent 40%)",
        border: `1px solid color-mix(in srgb, var(${accentVar}) 48%, transparent)`,
        boxShadow:
          `inset 0 0 44px color-mix(in srgb, var(${accentVar}) 24%, transparent),` +
          `0 0 30px color-mix(in srgb, var(${accentVar}) 18%, transparent)`,
      }}
    >
      {/* crisp top-edge light reflection — sells the glass surface */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- headless-rendered, see note above */}
      <img
        src={src}
        alt={alt}
        className="relative h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}
