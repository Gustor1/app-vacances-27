import { configuredNotificationWorker } from './bootstrap.ts';
Deno.serve(configuredNotificationWorker);
