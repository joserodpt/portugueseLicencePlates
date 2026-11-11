// Typed access to data/*.json — the single source of truth shared with the LaTeX write-up.
import conversion1911Json from "../../data/conversion-1911.json";
import diplomaticJson from "../../data/diplomatic-codes.json";
import districtsJson from "../../data/districts.json";
import exportJson from "../../data/export-customs.json";
import gnrJson from "../../data/gnr-functions.json";
import letterGroupsJson from "../../data/letter-groups.json";
import municipalitiesJson from "../../data/municipalities.json";
import rulesJson from "../../data/rules.json";
import seriesJson from "../../data/series.json";
import sourcesJson from "../../data/sources.json";
import trailerLisbonJson from "../../data/trailer-lisbon.json";
import type { Localized, PlateStyle, SeriesId } from "./types";

export interface CodeName {
  code: string;
  name: Localized;
  verified?: boolean;
  note?: Localized;
}
export interface Municipality {
  code: string;
  name: string;
  verified?: boolean;
  note?: Localized;
}
export interface LetterGroup {
  pairs: string[];
  kind: "island" | "temporary-import" | "regional" | "ex-colony" | "military" | "import" | "diplomatic" | "state";
  name: Localized;
  since?: number;
  until?: number;
  style?: "red" | "diplomatic";
  verified?: boolean;
  source: string;
}
export interface Zone {
  from: string;
  to: string;
  name: Localized;
  source: string;
}
export interface Series {
  id: SeriesId;
  format: string;
  from: string | null;
  to: string | null;
  style: PlateStyle;
  name: Localized;
  note?: Localized;
  source: string;
}
export interface Conversion1911Zone {
  zone: Localized;
  series: { from: number; letters: string }[];
}

export const series = seriesJson as Series[];
export const seriesById = Object.fromEntries(series.map((s) => [s.id, s])) as Record<SeriesId, Series>;
export const municipalities = municipalitiesJson as Municipality[];
export const districts = districtsJson as CodeName[];
export const gnrFunctions = gnrJson as CodeName[];
export const exportCustoms = exportJson as CodeName[];
export const diplomatic = diplomaticJson as {
  statuses: CodeName[];
  countries: { code: number; name: Localized }[];
};
export const letterGroups = letterGroupsJson as {
  zones1937: Zone[];
  groups1937: LetterGroup[];
  groups1992: LetterGroup[];
};
export const trailerLisbon = trailerLisbonJson as { from: number; to: number | null; period: Localized }[];
export const conversion1911 = conversion1911Json as Record<string, Conversion1911Zone>;
export const rules = rulesJson;
export const sources = sourcesJson as Record<string, { title: string; url: string | null }>;

export const byCode = <T extends { code: string }>(list: T[], code: string): T[] =>
  list.filter((x) => x.code === code);
