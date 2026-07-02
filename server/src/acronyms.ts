const ACRONYMS: string[] = [
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

export function acronymForDay(day: string): string {
  const ms = Date.parse(`${day}T00:00:00Z`);
  const index = Math.floor(ms / 86_400_000);
  return ACRONYMS[((index % ACRONYMS.length) + ACRONYMS.length) % ACRONYMS.length];
}
