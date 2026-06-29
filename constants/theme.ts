/**
 * Central design tokens for TLA — a warm, editorial aesthetic: a soft cream
 * canvas, deep ink-navy as the primary, and a sunny yellow as the highlight.
 *
 * Ported 1:1 from the original SwiftUI `Theme` enum.
 */
export const Theme = {
  /** Warm cream page background. */
  canvas: "#F6F3EA",
  /** Deep navy used for type and primary surfaces/buttons. */
  ink: "#1B2A4A",
  /** Muted navy for secondary text (ink @ 55%). */
  inkSoft: "rgba(27, 42, 74, 0.55)",
  /** Primary tint (navy) for buttons and active states. */
  accent: "#1B2A4A",
  accentSoft: "rgba(27, 42, 74, 0.08)",
  /** Sunny yellow highlight (the sunburst rays, lightbulb glow). */
  sunshine: "#F7C456",
  sunshineSoft: "rgba(247, 196, 86, 0.30)",
  /** Crisp white card surface that floats on the cream canvas. */
  card: "#FFFFFF",
  /** Link blue used for "See all" / inline actions. */
  link: "#2D6FD4",
  /** Heart red. */
  like: "#EA3C46",
  hairline: "rgba(27, 42, 74, 0.07)",

  cardRadius: 26,
  tileRadius: 16,
} as const;
