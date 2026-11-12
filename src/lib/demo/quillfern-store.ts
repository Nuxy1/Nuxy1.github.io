// The Quillfern demo cart and demo stock in this browser's storage (lib/demo/store.ts: never throws; with storage off
// the cart simply lasts until the page is left). What is kept: candle ids, sizes, quantities, pickup or shipping, the
// demo promo code, and the stock counts. Never a name, email, address or anything typed at checkout.
import { read, write, remove } from "./store";
import { normaliseCart, normaliseStock, defaultStock, emptyCart, type Cart, type Stock } from "./quillfern-cart";

const CART = "qf-cart-v1", STOCK = "qf-stock-v1";
const any = (v: unknown): v is unknown => v !== null;
let memo: { cart: Cart; stock: Stock } | null = null;

export function stock(): Stock {
  return memo?.stock ?? normaliseStock(read(STOCK, null, any));
}
export function cart(): Cart {
  if (memo) return memo.cart;
  return normaliseCart(read(CART, null, any), stock());
}

function changed(c: Cart) {
  document.dispatchEvent(new CustomEvent("qf:cart", { detail: c }));
}
export function saveCart(c: Cart) {
  const s = stock();
  const n = normaliseCart(c, s);
  memo = { cart: n, stock: s };
  if (n.lines.length || n.how !== "ship" || n.promo) write(CART, n); else remove(CART);
  changed(n);
  return n;
}
export function saveStock(s: Stock) {
  const n = normaliseStock(s);
  const c = normaliseCart(cart(), n);
  memo = { cart: c, stock: n };
  write(STOCK, n);
  changed(c);
}
export function clearCart() {
  memo = { cart: emptyCart(), stock: stock() };
  remove(CART);
  changed(memo.cart);
}
/** put the demo stock back to where it started */
export function resetStock() {
  memo = null;
  remove(STOCK);
  saveStock(defaultStock());
  remove(STOCK);
}

/** run `fn` now and whenever the cart or stock changes, in this tab or another one */
export function onCart(fn: (c: Cart, s: Stock) => void) {
  const run = () => fn(cart(), stock());
  document.addEventListener("qf:cart", run);
  addEventListener("storage", (e) => {
    if (e.key === null || e.key === CART || e.key === STOCK) { memo = null; run(); }
  });
  // coming back to a page from the back/forward cache: another page may have changed the cart
  addEventListener("pageshow", (e) => { if (e.persisted) { memo = null; run(); } });
  run();
}
