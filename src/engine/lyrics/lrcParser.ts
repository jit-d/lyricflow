/**
 * Parses standard LRC format into timed lyric lines.
 *
 * Handles the format returned by LRCLIB, e.g.:
 *   [00:09.44] मुझको इतना बताए कोई
 *   [00:13.40]
 *   [00:19.02] कैसे तुझसे दिल ना लगाए कोई?
 *
 * Rules:
 * - Empty lines (like [00:13.40]) are skipped.
 * - endMs is inferred from the next line's startMs.
 * - The last line gets a 5 second duration.
 * - Word-level timestamps are NOT parsed here; LRCLIB returns hasWordSync=false
 *   for the tracks we tested, so line-level is what we work with.
 */

export interface LyricLine {
  startMs: number;
  endMs: number;
  text: string;
}

export function parseLRC(lrc: string): LyricLine[] {
  if (!lrc) return [];

  const lines: LyricLine[] = [];
  const lineRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s?(.*)$/;

  for (const raw of lrc.split('\n')) {
    const match = raw.match(lineRegex);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);

    // Handle both centiseconds (2 digits) and milliseconds (3 digits)
    const fraction = match[3].length === 2
      ? parseInt(match[3], 10) * 10
      : parseInt(match[3], 10);

    const startMs = minutes * 60_000 + seconds * 1000 + fraction;
    const text = match[4].trim();

    if (text.length === 0) continue;

    lines.push({ startMs, endMs: startMs, text });
  }

  for (let i = 0; i < lines.length; i++) {
    const next = lines[i + 1];
    lines[i].endMs = next ? next.startMs : lines[i].startMs + 5000;
  }

  return lines;
}

/**
 * Returns the index of the line currently being sung at `currentMs`.
 * Returns -1 if we are before the first line.
 *
 * Uses binary search so it stays fast even with 100+ lyric lines
 * and is called on every animation frame.
 */
export function findActiveLineIndex(lines: LyricLine[], currentMs: number): number {
  if (lines.length === 0) return -1;
  if (currentMs < lines[0].startMs) return -1;

  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].startMs <= currentMs) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}