import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convert1911 } from "./convert1911";
import { decode } from "./decode";
import { next2020, vowelRuleOk } from "./letters";
import type { Interpretation, SeriesId } from "./types";
import { findWordPlates } from "./wordFinder";

const one = (input: string, series: SeriesId): Interpretation => {
  const found = decode(input).filter((i) => i.series === series);
  expect(found, `${input} as ${series}`).toHaveLength(1);
  return found[0];
};
const factValues = (it: Interpretation) => it.facts.map((f) => f.value.pt).join(" | ");
const severities = (it: Interpretation) => it.issues.map((i) => i.severity);

describe("1911 → 1937 conversion (examples from the 2023 PDF)", () => {
  it.each([
    ["S-12345", "AB-23-45"],
    ["N-1234", "MM-12-34"],
    ["C-123", "UU-01-23"],
    ["S-123", "AA-01-23"],
    ["S-30000", "AD-00-00"],
    ["N-10001", "MN-00-01"],
    ["C-4569-A", "UU-45-69"],
    ["S-1703-WW", "AA-17-03"],
  ])("%s → %s", (from, to) => {
    expect(convert1911(from)).toEqual({ ok: true, plate: to });
  });

  it("has no mapping for the islands, for Coimbra ≥ 10000 or for Lisbon ≥ 40000", () => {
    expect(convert1911("A-123").ok).toBe(false);
    expect(convert1911("M-123").ok).toBe(false);
    expect(convert1911("C-12345").ok).toBe(false);
    expect(convert1911("S-41000").ok).toBe(false);
  });
});

describe("decode", () => {
  it("1911 hire and provisional suffixes no longer crash", () => {
    expect(factValues(one("C-4569-A", "1911"))).toContain("Automóvel de aluguer");
    expect(factValues(one("S-1703-WW", "1911"))).toContain("Matrícula provisória");
  });

  it("1911 army MG-000", () => {
    expect(one("MG-123", "1911").facts[0].value.pt).toBe("Exército Português");
  });

  it("1937 zones, islands, military and temporary imports", () => {
    expect(factValues(one("AB-12-34", "1937"))).toContain("Zona de Lisboa");
    expect(factValues(one("NP-12-34", "1937"))).toContain("Zona do Porto");
    expect(factValues(one("UZ-12-34", "1937"))).toContain("Zona de Coimbra");
    expect(factValues(one("HO-12-34", "1937"))).toContain("Horta");
    expect(factValues(one("ME-12-34", "1937"))).toContain("Exército");
    expect(factValues(one("AM-12-34", "1937"))).toContain("Força Aérea");
    expect(one("TF-12-34", "1937").style).toBe("red");
  });

  it("1937 groups from Wikipedia: TA/TB/TC, pre-1985 diplomatic, EP", () => {
    expect(one("TA-12-34", "1937").style).toBe("red");
    const cd = one("CD-12-34", "1937");
    expect(cd.style).toBe("diplomatic");
    expect(factValues(cd)).toContain("antes de 1985");
    expect(factValues(one("EP-12-34", "1937"))).toContain("Administração Civil do Estado");
  });

  it("1937: Q/J/CU/FD are anachronisms, K/W/Y invalid", () => {
    expect(severities(one("QA-12-34", "1937"))).toContain("anachronism");
    expect(severities(one("AJ-12-34", "1937"))).toContain("anachronism");
    expect(severities(one("CU-12-34", "1937"))).toContain("anachronism");
    expect(severities(one("FD-12-34", "1937"))).toContain("anachronism");
    expect(severities(one("KA-12-34", "1937"))).toContain("invalid");
    expect(one("AB-12-34", "1937").issues).toEqual([]);
  });

  it("1992: K imports, W/Y never used", () => {
    expect(factValues(one("12-34-KC", "1992"))).toContain("segunda mão");
    expect(severities(one("12-34-KC", "1992"))).not.toContain("invalid");
    expect(severities(one("12-34-KG", "1992"))).toEqual(["unverified"]);
    expect(severities(one("12-34-KM", "1992"))).toEqual(["unverified"]);
    expect(severities(one("12-34-WA", "1992"))).toContain("invalid");
    expect(severities(one("12-34-AK", "1992"))).toContain("invalid");
    expect(one("12-34-AB", "1992").issues).toEqual([]);
  });

  it("2005: K/W/Y invalid", () => {
    expect(severities(one("12-KA-34", "2005"))).toContain("invalid");
    expect(one("12-AB-34", "2005").issues).toEqual([]);
  });

  it("2020: vowel rule, reserved AA 00 AA, K/W/Y unverified", () => {
    expect(severities(one("AB 31 CE", "2020"))).toContain("invalid");
    expect(severities(one("BA 31 CD", "2020"))).toContain("invalid");
    expect(one("AA 00 EE", "2020").issues).toEqual([]);
    expect(one("AA 12 BE", "2020").issues).toEqual([]); // AA lifts the rule for the whole plate
    expect(one("BC 12 DF", "2020").issues).toEqual([]);
    expect(severities(one("AA 00 AA", "2020"))).toContain("invalid");
    expect(severities(one("AK 12 BC", "2020"))).toEqual(["unverified"]);
    expect(one("AB-12-CD", "2020").display).toBe("AB 12 CD");
    expect(one("ab12cd", "2020").confidence).toBe("loose");
  });

  it("municipal moped plates", () => {
    expect(factValues(one("2-OER-20-75", "moto-municipal"))).toBe("Oeiras");
    expect(severities(one("2-XXX-20-75", "moto-municipal"))).toContain("invalid");
    const srp = one("1-SRP-12-34", "moto-municipal");
    expect(factValues(srp)).toBe("São Roque do Pico | Serpa");
    expect(severities(srp)).toContain("unverified");
  });

  it("civil trailers, with Lisbon dating and digit limits", () => {
    expect(factValues(one("L-60000", "trailer-civil"))).toContain("verão de 1979 e o início de 1990");
    expect(factValues(one("AV-1234", "trailer-civil"))).toContain("Aveiro");
    expect(severities(one("AV-123456", "trailer-civil"))).toContain("invalid");
    // Bragança: BG (2023 PDF) or BN (Wikipedia)
    expect(severities(one("BG-123", "trailer-civil"))).toEqual(["unverified"]);
    expect(severities(one("BN-123", "trailer-civil"))).toEqual(["unverified"]);
    expect(decode("ZZ-1234").filter((i) => i.series === "trailer-civil")).toEqual([]);
  });

  it("military trailers", () => {
    expect(factValues(one("123-M", "trailer-military"))).toBe("Exército");
    expect(factValues(one("E-12-34", "trailer-military"))).toBe("Força Aérea");
    // AP-12-34 is both a Navy car and a Navy trailer
    expect(decode("AP-12-34").map((i) => i.series).sort()).toEqual(["1937", "trailer-military"]);
  });

  it("GNR, export and diplomatic", () => {
    expect(factValues(one("GNR L-1234", "gnr"))).toBe("Ligeiro de Passageiros");
    expect(one("GNRL-1234", "gnr").display).toBe("GNR L-1234");
    expect(severities(one("GNR Z-1", "gnr"))).toContain("invalid");
    expect(factValues(one("12345-L", "export"))).toBe("Lisboa");
    expect(severities(one("123456-L", "export"))).toContain("unverified");
    const d = one("55-CD123", "diplomatic");
    expect(factValues(d)).toContain("Estados Unidos");
    expect(factValues(d)).toContain("Corpo Diplomático");
    expect(factValues(one("118-CD12", "diplomatic"))).toContain("Países Baixos");
  });

  it("exact separator matches sort first", () => {
    const r = decode("A-1234");
    expect(r.map((i) => i.series)).toEqual(["1911", "trailer-civil"]);
    expect(r.every((i) => i.confidence === "exact")).toBe(true);
  });

  it("returns nothing for garbage", () => {
    expect(decode("")).toEqual([]);
    expect(decode("hello world")).toEqual([]);
  });
});

describe("2020 sequence", () => {
  it("vowel rule", () => {
    expect(vowelRuleOk("AB", "CD")).toBe(true);
    expect(vowelRuleOk("BA", "CD")).toBe(false);
    expect(vowelRuleOk("EE", "CA")).toBe(true);
  });
  it("next2020 counts numbers, then the right pair, then the left; skips forbidden plates", () => {
    expect(next2020("AA 00 AA")).toBe("AA 01 AA");
    expect(next2020("AA 99 AA")).toBe("AA 00 AB");
    expect(next2020("BC 99 DD")).toBe("BC 00 DF"); // DE is skipped (vowel in 6th position)
    expect(next2020("BZ 99 ZZ")).toBe("CA 00 AA"); // the right pair AA lifts the vowel rule
    expect(next2020("ZZ 99 ZZ")).toBeNull();
  });
});

describe("word finder", () => {
  const words = readFileSync(new URL("../../data/words-pt.txt", import.meta.url), "utf8").split(/\r?\n/);

  it("reproduces the old main.py output when the vowel rule is off (3,321 plates)", () => {
    expect(findWordPlates(words)).toHaveLength(3321);
    expect(findWordPlates(words, { prefix: "A" })).toHaveLength(573);
  });

  it("keeps only issuable plates with the vowel rule on", () => {
    const all = findWordPlates(words);
    const valid = findWordPlates(words, { vowelRule: true });
    expect(valid.length).toBe(all.filter((p) => p.vowelRuleOk).length);
    expect(valid.length).toBeLessThan(all.length);
    expect(valid.find((p) => p.word === "ABSIDE")).toBeUndefined(); // AB 51 DE
  });

  it("maps digits and strips accents", () => {
    expect(findWordPlates(["abatei"])).toEqual([{ word: "ABATEI", plate: "AB 47 EI", vowelRuleOk: false }]);
    expect(findWordPlates(["Á-ZOBRA", "CRISTO"]).map((p) => p.plate)).toEqual(["CR 15 TO"]);
  });
});
