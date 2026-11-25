// Nuxy Automation's own text-message program (10DLC campaign TCR CWRUOGH). One home for the words a person agrees to,
// so the opt-in box (components/SmsConsent.astro), /sms-terms/ and /policies/#texts can never drift apart.
// The inquiry service keeps its own copy of the disclosure by version (agent src/sms/consent.js SMS_DISCLOSURES) and
// stores that exact text with every opt-in; a test there fails when the two differ. Changing a word here means a new
// smsDisclosureVersion, so a stored consent always points to the words that person actually saw.
// Texts are sent only after the person ticks the box, and the sending code stays off until the owner has confirmed
// the campaign and number are approved (docs/compliance/telnyx/CWRUOGH-resubmission.md).

export const smsProgram = "Nuxy Automation SMS Communications";
export const smsBrand = "Nuxy Automation";
export const smsSupportEmail = "nuxy@nuxyautomation.com";
// (what the texts are: customer care about a request the person sent us, nothing promotional)
export const smsUseCase = "customer care texts about my request, such as callback scheduling, replies to my questions and project updates";
export const smsDisclosureVersion = "2026-11-25";
export const smsTermsUpdated = "November 25, 2026";

// The checkbox label, and the disclosure printed under it (plain text: the links are added beside it by the component).
export const smsConsentLabel = `Text me (optional): I agree to receive ${smsUseCase} from ${smsBrand} at the number above.`;
export const smsDisclosure = `By checking this box and providing your phone number, you agree to receive SMS customer care messages from ${smsBrand} about your request. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. Consent is not a condition of purchase. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes.`;

// The replies a person gets to the keywords (also in the campaign packet; each is 20-320 characters).
export const smsReplies = {
  optIn: `${smsBrand}: Thanks for opting in to customer care texts about your request. Msg frequency varies. Msg&data rates may apply. Reply HELP for help, STOP to opt out.`,
  optOut: `${smsBrand}: You are unsubscribed and will receive no further messages. Reply START to resubscribe.`,
  help: `${smsBrand}: For help, email ${smsSupportEmail}. Msg&data rates may apply. Reply STOP to opt out.`,
} as const;
