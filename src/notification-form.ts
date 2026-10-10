import type { NotificationPreferences } from './notifications';
import type { Storage } from './journeys';

// Presentation intent is local/account-scoped, never part of the server API.
// Remember section choices when all delivery channels are off. A changed remote
// preference invalidates the hint, so another device's actual settings win.
export type NotificationIntent = { program: boolean; activities: boolean; phone: boolean; email: boolean };
const intentKey = (trip: string) => `detours-notification-form-v1:${trip}`;
export function notificationIntent(storage: Storage, trip: string, preferences: NotificationPreferences): NotificationIntent {
  try {
    const hint = JSON.parse(storage.getItem(intentKey(trip)) || 'null');
    if (hint?.source === JSON.stringify(preferences) && ['program', 'activities', 'phone', 'email'].every(key => typeof hint.intent?.[key] === 'boolean')) return hint.intent;
  } catch { /* A UI hint never prevents reading the actual preferences. */ }
  const any = preferences.activityPush || preferences.recapPush || preferences.email;
  return { program: any ? preferences.recapPush || preferences.email : true, activities: any ? preferences.activityPush : true, phone: preferences.activityPush || preferences.recapPush, email: preferences.email };
}
export function deliveryPreferences(preferences: NotificationPreferences, intent: NotificationIntent, baseline?: NotificationIntent): NotificationPreferences {
  const any = preferences.activityPush || preferences.recapPush || preferences.email;
  const previous = baseline || { program: any ? preferences.recapPush || preferences.email : true, activities: any ? preferences.activityPush : true, phone: preferences.activityPush || preferences.recapPush, email: preferences.email };
  const next = { ...preferences };
  // Only explicit changes to a control alter its channels. In particular, a
  // historical "activity push + recap email" must not gain recap push merely
  // because both the phone and program sections appear enabled.
  if (intent.phone !== previous.phone || intent.activities !== previous.activities) next.activityPush = intent.activities && intent.phone;
  if (intent.phone !== previous.phone || intent.program !== previous.program) next.recapPush = intent.program && intent.phone;
  if (intent.email !== previous.email || intent.program !== previous.program) next.email = intent.program && intent.email;
  return next;
}
export function writeNotificationIntent(storage: Storage, trip: string, preferences: NotificationPreferences, intent: NotificationIntent) {
  const raw = JSON.stringify({ source: JSON.stringify(preferences), intent });
  storage.setItem(intentKey(trip), raw);
  if (storage.getItem(intentKey(trip)) !== raw) throw Error('Notification form state was not saved');
}
