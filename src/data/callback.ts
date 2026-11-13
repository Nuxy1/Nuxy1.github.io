// The "Request a callback" form (components/CallbackForm.astro): what the call is about and the part of a business
// day the person would like a call. The same ids and labels as CALLBACK_REASONS and CALLBACK_WINDOWS in the inquiry
// service (agent src/inquiry.js; a test there fails when the two lists differ). The time of day is a preference only:
// the site never offers, shows or promises a time, and nothing is booked by sending the form.

export const callbackReasons = [
  { id: "new-website", label: "A new website" },
  { id: "online-store", label: "An online store" },
  { id: "automation", label: "An automation" },
  { id: "website-help", label: "Help with my current website" },
  { id: "other", label: "Something else" },
] as const;

export const callbackWindows = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Early evening" },
  { id: "any", label: "Any time of day" },
] as const;

// How the times of day are meant, said once next to the choices.
export const callbackWindowNote = "business days, Central time";
