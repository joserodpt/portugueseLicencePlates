import { CLASSIC_ALPHABET, KWY, vowelRuleOk } from "./letters";

/** Digits read as letters (the same table the old main.py used). */
export const DIGIT_AS_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "3": "E",
  "4": "A",
  "5": "S",
  "6": "G",
  "7": "T",
  "8": "B",
  "9": "P",
};
const LETTER_AS_DIGIT = Object.fromEntries(Object.entries(DIGIT_AS_LETTER).map(([d, l]) => [l, d]));

export interface WordFinderOptions {
  /** Allow K, W and Y on the letter pairs (announced for 2020, unconfirmed). */
  includeKWY?: boolean;
  /** Keep only plates the 2020 vowel rule allows. */
  vowelRule?: boolean;
  /** Keep only plates starting with this prefix (e.g. "A" for the A series). */
  prefix?: string;
}

export interface WordPlate {
  word: string;
  plate: string;
  /** False when the 2020 vowel rule forbids the plate. */
  vowelRuleOk: boolean;
}

/** Uppercase and strip accents, so "Ábaco" and "ABACO" are the same word. */
export const normalizeWord = (w: string) =>
  w.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().trim();

/**
 * 6-letter words that can be read on a 2020-series plate (XX 00 XX), with the
 * middle two characters read as digits. For example, ABATEI → AB 47 EI.
 * This checks each word once, instead of walking all ~28 million plates as
 * main.py did.
 */
export function findWordPlates(words: Iterable<string>, opts: WordFinderOptions = {}): WordPlate[] {
  const alphabet = CLASSIC_ALPHABET + (opts.includeKWY ? KWY : "");
  const prefix = normalizeWord(opts.prefix ?? "");
  const seen = new Set<string>();
  const out: WordPlate[] = [];
  for (const raw of words) {
    const w = normalizeWord(raw);
    if (!/^[A-Z]{6}$/.test(w) || seen.has(w)) continue;
    seen.add(w);
    const d1 = LETTER_AS_DIGIT[w[2]];
    const d2 = LETTER_AS_DIGIT[w[3]];
    if (d1 === undefined || d2 === undefined) continue;
    const left = w.slice(0, 2);
    const right = w.slice(4);
    if (![...left, ...right].every((c) => alphabet.includes(c))) continue;
    const plate = `${left} ${d1}${d2} ${right}`;
    if (plate === "AA 00 AA") continue; // reserved, never issued
    if (prefix && !plate.replace(/ /g, "").startsWith(prefix)) continue;
    const ok = vowelRuleOk(left, right);
    if (opts.vowelRule && !ok) continue;
    out.push({ word: w, plate, vowelRuleOk: ok });
  }
  return out.sort((a, b) => a.plate.localeCompare(b.plate));
}
