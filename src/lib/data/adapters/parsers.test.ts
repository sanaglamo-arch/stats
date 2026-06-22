import { describe, it, expect } from "vitest";
import {
  decodeEmbeddedJson,
  understatSeasonToLabel,
  parseUnderstatSeasons,
} from "./understat";
import { parseFbrefShooting } from "./fbref";
import { bindingToRaw } from "./wikidata";

/**
 * Adapter PARSE tests — fixtures only, never the network. They prove the live
 * parse paths work so that when a source IS reachable the data normalizes
 * correctly.
 */

describe("understat parsers", () => {
  it("maps calendar year to YYYY/YY label", () => {
    expect(understatSeasonToLabel("2014")).toBe("2014/15");
    expect(understatSeasonToLabel("2009")).toBe("2009/10");
    expect(understatSeasonToLabel("2019")).toBe("2019/20");
  });

  it("decodes hex-escaped embedded JSON", () => {
    // {"season":[{"season":"2014","xG":"32.1","xA":"14.6"}]}
    const json = '{"season":[{"season":"2014","xG":"32.1","xA":"14.6"}]}';
    const escaped = json.replace(/[{}[\]]/g, (c) => `\\x${c.charCodeAt(0).toString(16).toUpperCase()}`);
    const html = `<script>var groupsData = JSON.parse('${escaped}');</script>`;
    const decoded = decodeEmbeddedJson(html, "groupsData") as {
      season: Array<{ season: string; xG: string; xA: string }>;
    };
    expect(decoded.season[0].xG).toBe("32.1");
  });

  it("throws when the embedded var is missing (caller degrades to seed)", () => {
    expect(() => decodeEmbeddedJson("<html></html>", "groupsData")).toThrow();
  });

  it("keeps only 2014+ seasons with both xG and xA", () => {
    const recs = parseUnderstatSeasons("messi", [
      { season: "2013", xG: "30", xA: "10" }, // pre-2014 → dropped
      { season: "2014", xG: "32.1", xA: "14.6" },
      { season: "2015", xG: "24.4" }, // missing xA → dropped
    ]);
    expect(recs).toHaveLength(1);
    expect(recs[0].season).toBe("2014/15");
    expect(recs[0].xg).toBe("32.1");
  });
});

describe("fbref parser", () => {
  const html = `
    <table><tbody>
      <tr>
        <th data-stat="year_id">2014-2015</th>
        <td data-stat="comp_level">La Liga</td>
        <td data-stat="shots_total">174</td>
        <td data-stat="shots_on_target">92</td>
        <td data-stat="cards_yellow">3</td>
        <td data-stat="cards_red">0</td>
      </tr>
      <tr>
        <th data-stat="year_id">Squad Total</th>
        <td data-stat="shots_total">999</td>
      </tr>
    </tbody></table>`;

  it("parses shooting rows and skips non-season rows", () => {
    const recs = parseFbrefShooting("messi", html);
    expect(recs).toHaveLength(1);
    expect(recs[0].season).toBe("2014/15");
    expect(recs[0].shots).toBe(174);
    expect(recs[0].shotsOnTarget).toBe(92);
    expect(recs[0].yellowCards).toBe(3);
  });

  it("parses tables wrapped in HTML comments", () => {
    const commented = `<!-- ${html} -->`;
    const recs = parseFbrefShooting("ronaldo", commented);
    expect(recs).toHaveLength(1);
    expect(recs[0].player).toBe("ronaldo");
  });
});

describe("wikidata binding", () => {
  it("returns null when season or club is missing", () => {
    expect(bindingToRaw("messi", {})).toBeNull();
    expect(bindingToRaw("messi", { season: { value: "2011/12" } })).toBeNull();
  });

  it("maps a complete binding to a raw record", () => {
    const raw = bindingToRaw("messi", {
      season: { value: "2011/12" },
      club: { value: "Barcelona" },
      competition: { value: "La Liga" },
      matches: { value: "37" },
      goals: { value: "50" },
    });
    expect(raw?.club).toBe("Barcelona");
    expect(raw?.goals).toBe("50");
  });
});
