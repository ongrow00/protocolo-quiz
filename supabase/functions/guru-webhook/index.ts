import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { guruAdapter } from '../_shared/guru/adapter.ts';
import { handleWebhook } from '../_shared/payments/handler.ts';

Deno.serve((request) => handleWebhook(request, guruAdapter));
