/** Relative "time ago" label from a millisecond timestamp. */
export function timeAgo(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** Formats a "yyyy-MM-dd" UTC day string as e.g. "June 22, 2026". */
export function prettyDate(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (isNaN(date.getTime())) return day;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Shorter medium-style date, e.g. "Jun 22, 2026". */
export function prettyDateShort(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (isNaN(date.getTime())) return day;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
