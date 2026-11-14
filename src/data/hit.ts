// Anonymous page counts (event + page + day; no cookies, no IP, no form contents). Empty string = off.
// Its own module because the browser script in layouts/Base.astro imports it: importing it from ./site would pull
// the whole site data (the client case studies among it) into the script every page loads.
export const hitUrl: string = import.meta.env.PUBLIC_HIT_URL ?? "https://preview.nuxyautomation.com/hit";
