/** Shared by local recognition and untrusted provider validation. Uncertain claims stay unchecked. */
export function hasConfirmedBooking(text: string): boolean {
  const affirmative = /(?<!\p{L})(?:réservé[e]?|confirmé[e]?|booked|confirmed|reserved|reservad[oa]|confirmad[oa])(?!\p{L})|已确认|已預訂|已预订/iu;
  const uncertain = /(?:non[\s-]|pas\b|sans\b|not\b|unconfirmed|unbooked|未|没有|sin\b|no\b|à réserver|a reserver|to book|pending|à confirmer|si\b|if\b|是否|待|\b(?:sera|seront|serait|seraient|devrait|devraient|will|would|ne)\b|annul|cancel|取消|sous réserve|subject to|[?？])/iu;
  const restriction = /(?:réservé[e]?\s+(?:aux?\b|pour\b)|(?:accès|zone|espace|emplacement)\s+réservé|reserved\s+(?:for|to|seating|access)|(?:access|area|seating)\s+(?:is\s+)?reserved)/iu;
  return affirmative.test(text) && !uncertain.test(text) && !restriction.test(text);
}
