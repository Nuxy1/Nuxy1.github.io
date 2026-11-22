// Ties the last two words of a short paragraph with a no-break space, so it never ends on one word alone (the audit
// of 11-21 found "involved." and "included." by themselves in the 312px level cards; Chromium's text-wrap: pretty
// left those as they were). A hyphen inside those two words gets an invisible word joiner (U+2060) after it, or
// "real-time 3D." still breaks as "real- / time 3D.". For data-driven text only; hand-written copy uses &nbsp;.
export const noWidow = (text: string): string =>
  text.replace(/(\S+) (\S+)$/, (_, a: string, b: string) => `${a} ${b}`.replace(/-/g, "-⁠"));
