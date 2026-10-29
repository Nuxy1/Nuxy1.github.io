// Real reviews only, copied word for word from where they were left (Fiverr, Upwork, Google, or an email the client
// agreed to have quoted), with a link to the original where there is one. While this list is empty, the homepage shows
// no reviews section at all. Never edit a review's words; trim with "..." only.
export type Review = { quote: string; name: string; business?: string; source: "Fiverr" | "Upwork" | "Google" | "Email"; link?: string; date: string; stars?: number };

export const reviews: Review[] = [];
