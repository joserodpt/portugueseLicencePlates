import { rules } from "./data";

/** The 23 letters used before 2020: no K, W or Y. */
export const CLASSIC_ALPHABET = rules.alphabet.classic;
/** K, W and Y — announced for the 2020 series, not confirmed as issued. */
export const KWY = rules.alphabet.kwy;

const VOWELS = rules.vowelRule2020.vowels;

export const isVowel = (c: string) => VOWELS.includes(c);
export const isDoubledVowel = (pair: string) => pair[0] === pair[1] && isVowel(pair[0]);
export const hasKWY = (letters: string) => [...letters].some((c) => KWY.includes(c));

/**
 * 2020 series (IMT, 14/08/2020): no vowels in the 2nd and 6th positions,
 * unless either letter pair is a doubled vowel (AA, EE, II, OO, UU).
 */
export function vowelRuleOk(left: string, right: string): boolean {
  if (isDoubledVowel(left) || isDoubledVowel(right)) return true;
  return !isVowel(left[1]) && !isVowel(right[1]);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Next plate of the 2020 series in the assumed issue order: the numbers first,
 * then the right pair, then the left pair. That order matches the first plate
 * (AA 01 AA), but IMT never published it. Skips plates the vowel rule forbids
 * and the reserved AA 00 AA. Returns null after the last plate.
 */
export function next2020(plate: string, alphabet = CLASSIC_ALPHABET): string | null {
  const m = /^([A-Z]{2})[ -]?(\d{2})[ -]?([A-Z]{2})$/.exec(plate.toUpperCase().trim());
  if (!m) throw new Error(`Not a 2020-series plate: ${plate}`);
  let [left, num, right] = [m[1], Number(m[2]), m[3]];
  const n = alphabet.length;
  const pairIndex = (p: string) => alphabet.indexOf(p[0]) * n + alphabet.indexOf(p[1]);
  const pairAt = (i: number) => alphabet[Math.floor(i / n)] + alphabet[i % n];
  let l = pairIndex(left);
  let r = pairIndex(right);
  if (l < 0 || r < 0) throw new Error(`Letter outside the alphabet: ${plate}`);
  for (;;) {
    num++;
    if (num > 99) {
      num = 0;
      r++;
      if (r >= n * n) {
        r = 0;
        l++;
        if (l >= n * n) return null;
      }
    }
    left = pairAt(l);
    right = pairAt(r);
    const candidate = `${left} ${pad2(num)} ${right}`;
    if (candidate === "AA 00 AA") continue;
    if (vowelRuleOk(left, right)) return candidate;
  }
}
