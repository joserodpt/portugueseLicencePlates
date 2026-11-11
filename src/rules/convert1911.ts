import { conversion1911 } from "./data";
import { L, type Localized } from "./types";

export type Conversion1911 =
  | { ok: true; plate: string }
  | { ok: false; reason: Localized };

/**
 * Converts a 1911 plate (S-12345, N-1234, C-123, optionally with the -A hire or
 * -WW provisional suffix) to the 1937 plate it was re-registered under.
 */
export function convert1911(input: string): Conversion1911 {
  const m = /^([NCSAM])\s*-?\s*(\d{1,5})(?:\s*-?\s*(A|WW))?$/.exec(input.toUpperCase().trim());
  if (!m) return { ok: false, reason: L("Não é uma matrícula de 1911.", "Not a 1911 plate.") };
  const [, zone, digits] = m;
  const number = Number(digits);
  const rule = conversion1911[zone];
  if (!rule.series.length) {
    return {
      ok: false,
      reason: L(
        "Os Açores e a Madeira mantiveram este sistema até 1962 e não há uma correspondência conhecida para a série de 1937.",
        "The Azores and Madeira kept this system until 1962, and there is no known mapping to the 1937 series.",
      ),
    };
  }
  const step = [...rule.series].reverse().find((s) => number >= s.from)!;
  const rest = number - step.from;
  if (rest > 9999) {
    return {
      ok: false,
      reason: L(
        `A fonte não indica para que série passaram os números a partir de ${step.from + 10000} de ${rule.zone.pt}.`,
        `The source does not say which series numbers from ${step.from + 10000} in ${rule.zone.en} moved to.`,
      ),
    };
  }
  const four = String(rest).padStart(4, "0");
  return { ok: true, plate: `${step.letters}-${four.slice(0, 2)}-${four.slice(2)}` };
}
