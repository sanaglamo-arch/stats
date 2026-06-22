/**
 * Minimal layout for the headless render segment. The card paints its own
 * background; we just strip body chrome so the screenshot is full-bleed.
 */
export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, lineHeight: 0 }} data-render-root>
      {children}
    </div>
  );
}
