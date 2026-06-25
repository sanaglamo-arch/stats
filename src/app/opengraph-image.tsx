import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PLAYER_META } from "@/components/card/player-meta";
import { buildShareModel } from "@/components/share/share-model";

/**
 * Dynamic Open Graph / Twitter share image (Phase 11 SEO). A landscape
 * 1200×630 "verdict" preview built from the REAL arena model (same data as the
 * share card), so links unfurl with the live Messi-vs-Ronaldo verdict instead of
 * a blank preview. Rendered by next/og (satori) — no headless Chrome, no RNG/
 * clock, deterministic from the bundled dataset. Re-export drives twitter-image.
 */
export const runtime = "nodejs";
export const alt = "CompareGOATs — Messi vs Ronaldo, the GOAT verdict by the numbers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Inline a bundled public asset as a data URI (no network, build-safe). */
function dataUri(rel: string): string {
  const bytes = readFileSync(join(process.cwd(), "public", rel));
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

const NAVY = "#070b16";
const GOLD = "#f5b43c";
const BLUE = "#3a82ff";
const RED = "#ff1b2d";
const TEXT = "#f8fafc";
const MUTED = "#9aa7bd";

export default function OpengraphImage() {
  // Default verdict: all categories, winner shown (deterministic).
  const model = buildShareModel(null, true);
  const messiImg = dataUri(PLAYER_META.messi.photoSrc.replace(/^\//, ""));
  const ronaldoImg = dataUri(PLAYER_META.ronaldo.photoSrc.replace(/^\//, ""));
  const winnerName =
    model.winner === "messi" ? "MESSI" : model.winner === "ronaldo" ? "RONALDO" : "DEAD HEAT";

  const side = (img: string, name: string, accent: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 320 }}>
      <img
        src={img}
        width={216}
        height={216}
        style={{
          width: 216,
          height: 216,
          borderRadius: 16,
          objectFit: "cover",
          border: `4px solid ${accent}`,
        }}
      />
      <div
        style={{
          marginTop: 22,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 1,
          color: accent,
          textTransform: "uppercase",
        }}
      >
        {name}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: NAVY,
          backgroundImage:
            "radial-gradient(900px 500px at 18% -10%, rgba(58,130,255,0.16), transparent 60%), radial-gradient(900px 500px at 82% 110%, rgba(255,27,45,0.16), transparent 60%)",
          color: TEXT,
          padding: "44px 56px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>
          <span style={{ color: GOLD }}>COMPARE</span>
          <span style={{ color: TEXT }}>GOATS</span>
        </div>

        {/* Clash */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
          {side(messiImg, "Messi", BLUE)}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 260 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: MUTED }}>VS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 130, fontWeight: 900, color: GOLD, lineHeight: 1 }}>
              <span>{model.score.messi}</span>
              <span style={{ color: MUTED, fontSize: 90 }}>–</span>
              <span>{model.score.ronaldo}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: MUTED, marginTop: 6 }}>
              CATEGORIES WON
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, color: GOLD, marginTop: 12 }}>
              {winnerName === "DEAD HEAT" ? "DEAD HEAT" : `${winnerName} WINS`}
            </div>
          </div>
          {side(ronaldoImg, "Ronaldo", RED)}
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 26, fontWeight: 600, color: MUTED, textAlign: "center" }}>
          Messi vs Ronaldo — settle the GOAT debate by the numbers
        </div>
      </div>
    ),
    { ...size },
  );
}
