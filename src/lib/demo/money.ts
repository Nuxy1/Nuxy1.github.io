export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const usd2 = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "$85–$120", or one amount when both ends match */
export const range = (lo: number, hi: number) => (Math.round(lo) === Math.round(hi) ? usd(lo) : `${usd(lo)}–${usd(hi)}`);
export const round5 = (n: number) => Math.round(n / 5) * 5;
