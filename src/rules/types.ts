export type Lang = "pt" | "en";
export type Localized = Record<Lang, string>;

export type SeriesId =
  | "1911"
  | "1937"
  | "1992"
  | "2005"
  | "2020"
  | "moto-municipal"
  | "trailer-civil"
  | "trailer-military"
  | "gnr"
  | "export"
  | "diplomatic";

/** How the physical plate looks, used by the plate renderer. */
export type PlateStyle =
  | "black" // white characters on black (until 1991)
  | "red" // white characters on red (temporary import)
  | "euro" // white, eurobanda, no date band (1992–1997)
  | "euro-date" // white, eurobanda, yellow date band (1998–2020)
  | "euro-2020" // white, eurobanda, spaces, no date band
  | "yellow" // mopeds / municipal plates
  | "export" // yellow with EXP
  | "diplomatic"; // white with red characters

/**
 * - invalid: the plate cannot exist under the documented rules.
 * - anachronism: valid only in a different period than the series suggests.
 * - unverified: depends on a rule or table entry we could not confirm.
 * - info: worth knowing, not a problem.
 */
export type Severity = "invalid" | "anachronism" | "unverified" | "info";

export interface Issue {
  severity: Severity;
  message: Localized;
  source?: string;
}

export interface Fact {
  label: Localized;
  value: Localized;
}

export interface Interpretation {
  series: SeriesId;
  /** The plate written the way it appears on the physical plate. */
  display: string;
  /** "exact" when the input's separators match this format, "loose" when only the characters do. */
  confidence: "exact" | "loose";
  style: PlateStyle;
  title: Localized;
  facts: Fact[];
  issues: Issue[];
}

export const L = (pt: string, en: string = pt): Localized => ({ pt, en });
