// Browser storage that never throws (storage can be off, full, or blocked in a private window: the demo then simply
// forgets). Only the Quillfern cart and its demo stock are stored; never names, emails or phone numbers.
export function read<T>(key: string, fallback: T, ok: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return ok(v) ? v : fallback;
  } catch { return fallback; }
}
export function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function remove(key: string) {
  try { localStorage.removeItem(key); } catch {}
}
