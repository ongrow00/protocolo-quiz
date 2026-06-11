import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { handleLastlinkWebhook } from '../_shared/lastlink/handler.ts';

Deno.serve((request) => handleLastlinkWebhook(request));
