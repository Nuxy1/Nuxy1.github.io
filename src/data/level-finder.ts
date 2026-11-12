// The website level finder (owner's brief, 2026-11-12): five questions on /web-design/ that suggest a website level.
// It lives apart from tiers.ts so the page's script can import it without pulling the whole service catalogue
// (data/services.ts) into the browser. tiers.ts re-exports all of it; tests/levels.test.mjs checks the names match.
//
// Each answer adds points to one or more levels. The finder always recommends a level and never turns anyone away:
// a small budget with big plans gets the closest level plus a way to grow into the one they described.

export type LevelId = "business" | "signature" | "immersive" | "flagship";

export const levelOrder: LevelId[] = ["business", "signature", "immersive", "flagship"];
export const levelNames: Record<LevelId, string> = { business: "Business", signature: "Signature", immersive: "Immersive", flagship: "Flagship" };

export type Question = { id: string; text: string; answers: { id: string; text: string; points: Partial<Record<LevelId, number>> }[] };

export const questions: Question[] = [
  { id: "goal", text: "What should the website do first?", answers: [
    { id: "leads", text: "Bring in calls, bookings or quote requests", points: { business: 3 } },
    { id: "standout", text: "Make us look more premium than competitors", points: { signature: 3 } },
    { id: "launch", text: "Launch a product or brand people remember", points: { immersive: 3 } },
    { id: "custom", text: "Something custom, like a configurator or tool", points: { flagship: 3 } },
  ] },
  { id: "now", text: "Where are you today?", answers: [
    { id: "none", text: "No website, or one that doesn’t work", points: { business: 2 } },
    { id: "dated", text: "A working site that looks dated", points: { business: 1, signature: 1 } },
    { id: "good", text: "A good site we’ve outgrown", points: { signature: 1, immersive: 1 } },
    { id: "brand", text: "A strong brand that needs a stage", points: { immersive: 1, flagship: 1 } },
  ] },
  { id: "feel", text: "How should it feel?", answers: [
    { id: "simple", text: "Simple and clear", points: { business: 2 } },
    { id: "polished", text: "Polished, with tasteful movement", points: { signature: 2 } },
    { id: "explore", text: "Something to explore, with depth or 3D", points: { immersive: 2 } },
    { id: "unsure", text: "Not sure: whatever works best", points: { business: 1, signature: 1 } },
  ] },
  // The budget adds no points: it only caps the level (`ceiling` below). If it also scored, a small budget would
  // outvote what the visitor described and the finder could never say "for the level you described…".
  { id: "budget", text: "Roughly what budget do you have in mind?", answers: [
    { id: "lt1000", text: "Under $1,000", points: {} },
    { id: "1000-6000", text: "$1,000 to $6,000", points: {} },
    { id: "6000-12000", text: "$6,000 to $12,000", points: {} },
    { id: "gt12000", text: "More than $12,000", points: {} },
    { id: "unsure", text: "Not sure yet", points: {} },
  ] },
  { id: "when", text: "When do you need it?", answers: [
    { id: "soon", text: "Within a few weeks", points: { business: 1 } },
    { id: "months", text: "In the next 1–3 months", points: { signature: 1, immersive: 1 } },
    { id: "flexible", text: "It’s flexible", points: { immersive: 1, flagship: 1 } },
  ] },
];

// the highest level each budget answer comfortably covers (unsure: no limit)
const ceiling: Record<string, LevelId> = { lt1000: "business", "1000-6000": "signature", "6000-12000": "immersive", gt12000: "flagship" };

export type Recommendation = { level: LevelId; reason: string; next?: LevelId };

/** answers: question id -> answer id. Missing answers count as no points. Ties go to the lower level. */
export function recommend(answers: Record<string, string>): Recommendation {
  const score: Record<LevelId, number> = { business: 0, signature: 0, immersive: 0, flagship: 0 };
  for (const q of questions) {
    const a = q.answers.find((x) => x.id === answers[q.id]);
    for (const [l, p] of Object.entries(a?.points ?? {})) score[l as LevelId] += p ?? 0;
  }
  let best: LevelId = "business";
  for (const l of levelOrder) if (score[l] > score[best]) best = l;
  const wanted = best;
  const cap = ceiling[answers.budget ?? ""];
  if (cap && levelOrder.indexOf(best) > levelOrder.indexOf(cap)) best = cap;
  const goal = answers.goal;
  const reasons: Record<LevelId, string> = {
    business: goal === "leads" || !goal
      ? "You want more calls, bookings and quote requests. A clear, fast Business website does exactly that, and it’s the quickest to launch."
      : "A Business website gets you a professional, fast site now, and you can move up a level when it makes sense.",
    signature: "You want to look more premium than the businesses around you. Signature gives you a custom design and polished motion without the cost of full 3D.",
    immersive: "You want a first impression people remember. Immersive builds the page as an experience, with scroll storytelling and 3D where the idea calls for it.",
    flagship: "What you describe goes beyond a package: a configurator, several scenes or systems behind the site. Flagship starts with a written scope made with you.",
  };
  const r: Recommendation = { level: best, reason: reasons[best] };
  if (wanted !== best) {
    r.next = wanted;
    r.reason += ` For the ${levelNames[wanted]} level you described, we can plan it in stages or start with a single add-on.`;
  }
  return r;
}
