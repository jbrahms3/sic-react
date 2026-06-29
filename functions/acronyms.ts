// Curated list of fun, postable 3-letter acronyms. The acronym of the day
// rotates deterministically by UTC day so every client sees the same one.

export const ACRONYMS: string[] = [
  "BFG", "OMG", "WTF", "FYI", "BFF", "LOL", "TBH", "IDK", "SOS", "VIP",
  "DIY", "ETA", "FAQ", "ASAP", "BRB", "DJ", "MVP", "RIP", "TGI", "YOLO",
  "CEO", "DNA", "UFO", "GPS", "ATM", "FBI", "NSA", "NBA", "MIA", "POV",
  "BAE", "FOMO", "TMI", "AKA", "AFK", "GG", "OG", "PSA", "RSVP", "TTY",
  "WIP", "EOD", "FTW", "IRL", "JK", "LMK", "NVM", "OOO", "QnA", "SMH",
  "TBD", "TLC", "WYD", "XOXO", "ZZZ", "ABC", "XYZ", "BBQ", "PBJ", "VHS",
  "CPU", "RAM", "SSD", "USB", "LED", "GIF", "PDF", "URL", "WWW", "API",
  "MIC", "FAB", "JOY", "ZAP", "FOX", "OWL", "CAT", "DOG", "SUN", "SKY",
  "ICE", "FOG", "MUD", "JAM", "PIE", "TEA", "EGG", "HAM", "OAT", "FIG",
  "ACE", "JET", "VAN", "BUS", "CAB", "OAR", "MAP", "KEY", "PEN", "INK",
];

/** UTC day string, e.g. "2026-06-22". */
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Number of whole UTC days since the Unix epoch. */
function dayIndex(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** The acronym for a given day string. */
export function acronymForDay(day: string): string {
  const ms = Date.parse(`${day}T00:00:00Z`);
  const index = Math.floor(ms / 86_400_000);
  return ACRONYMS[((index % ACRONYMS.length) + ACRONYMS.length) % ACRONYMS.length];
}

/** Milliseconds until the next UTC midnight (next acronym). */
export function msUntilNextDay(date: Date = new Date()): number {
  const next = (dayIndex(date) + 1) * 86_400_000;
  return next - date.getTime();
}
