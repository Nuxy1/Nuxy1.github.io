// security.txt (RFC 9116) in the built site: where to report a security problem (finding 022 of the 2026-11-11 audit).
// Runs on the production build in dist/; nothing leaves this computer.
//
//   npm run build && node --test tests/security-txt.test.mjs
//
// The file must be renewed every year. This test starts failing 30 days before "Expires" on purpose, as the reminder:
// move the date one year on (at most a year ahead) in public/.well-known/security.txt and rebuild.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", ".well-known", "security.txt");
const fields = () =>
  Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1).trim()]),
  );

test("security.txt is in the build with a contact, a canonical address and a valid expiry", () => {
  const f = fields();
  assert.match(f.Contact ?? "", /^mailto:[^@\s]+@nuxyautomation\.com$/);
  assert.equal(f.Canonical, "https://nuxyautomation.com/.well-known/security.txt");
  const expires = Date.parse(f.Expires ?? "");
  assert.ok(Number.isFinite(expires), "Expires must be a date");
  // (the standard asks for less than a year ahead)
  assert.ok(expires - Date.now() <= 366 * 86_400_000, "Expires is more than a year ahead");
  assert.ok(expires - Date.now() > 30 * 86_400_000, "security.txt expires within 30 days: move Expires one year on");
});

test("security.txt is plain text with Unix line ends and no stray fields", () => {
  const raw = readFileSync(file, "utf8");
  assert.ok(!raw.includes("\r"), "line ends must be LF");
  const allowed = new Set(["Contact", "Expires", "Preferred-Languages", "Canonical", "Encryption", "Acknowledgments", "Policy", "Hiring", "CSAF"]);
  for (const name of Object.keys(fields())) assert.ok(allowed.has(name), `unknown field ${name}`);
});
