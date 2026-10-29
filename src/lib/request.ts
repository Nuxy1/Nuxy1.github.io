// The request form is an email: no server to run, and the answer lands in the inbox the work runs from.
// (a chosen service's own request names it at the top; Gmail and Outlook links for computers with no email app,
// where a mailto: link does nothing at all)
export const inbox = "nuxy@nuxyautomation.com";
export type Item = { name: string; price: string };
const subject = (p?: Item) => (p ? `Setup request: ${p.name}` : "Setup request");
const body = (p?: Item) => `${p ? `Service: ${p.name} (${p.price})\n` : ""}Business name:\nWebsite:\nWhat kind of business:\nTools you use now (booking, ordering, accounting, email, CRM...):\nWhat you'd like fixed or set up:\nAnything else:\n`;
const query = (fields: Record<string, string>) => new URLSearchParams(fields).toString().replace(/\+/g, "%20");
export const ask = (p?: Item) => `mailto:${inbox}?` + query({ subject: subject(p), body: body(p) });
export const gmail = (p?: Item) => "https://mail.google.com/mail/?" + query({ view: "cm", fs: "1", to: inbox, su: subject(p), body: body(p) });
export const outlook = (p?: Item) => "https://outlook.live.com/mail/0/deeplink/compose?" + query({ to: inbox, subject: subject(p), body: body(p) });
