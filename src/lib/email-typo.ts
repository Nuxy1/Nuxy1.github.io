// A likely typo in a well-known email domain ("gmial.com", "gmail.con"), for the quote form to ASK about: the customer
// confirms or keeps what they typed; nothing is changed for them. The same list and rule as emailTypo in the inquiry
// service's src/inquiry.js, which flags it on the lead too; tests/contact-form.test.mjs checks the two agree.
// Only the name before the last dot is compared, with room for 1-2 slips on longer names and none on short ones, so
// real domains (yahoo.ca, comcast.com, a business's own) are left alone.
const MAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "live.com", "msn.com", "me.com", "ymail.com", "mail.com", "gmx.com", "proton.me", "protonmail.com", "comcast.net", "att.net", "charter.net", "verizon.net", "sbcglobal.net", "frontier.com", "centurylink.net"];

function editDistance(a: string, b: string): number {
  // (optimal string alignment: insertions, deletions, substitutions and swapped neighbours each cost 1)
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// The known domain they probably meant, or "".
export function emailTypo(email: string): string {
  const domain = String(email ?? "").toLowerCase().split("@")[1] ?? "";
  if (!domain || MAIL_DOMAINS.includes(domain)) return "";
  const cut = domain.lastIndexOf(".");
  const [name, tld] = [domain.slice(0, cut), domain.slice(cut + 1)];
  for (const known of MAIL_DOMAINS) {
    const k = known.lastIndexOf(".");
    const [kName, kTld] = [known.slice(0, k), known.slice(k + 1)];
    const tldOk = tld === kTld || (tld.length >= 2 && editDistance(tld, kTld) === 1);
    const reach = kName.length >= 7 ? 2 : kName.length >= 5 ? 1 : 0; // (short names: only the ending is checked)
    if (tldOk && editDistance(name, kName) <= reach) return known;
  }
  return "";
}
