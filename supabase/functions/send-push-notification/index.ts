import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;
const MAX_PUSHES_PER_MINUTE = 10;
const STALE_CLAIM_SECONDS = 60;
const EXPO_REQUEST_TIMEOUT_MS = 10_000;

type ClaimResult = {
  claim_status: "claimed" | "already_processed" | "in_progress" | "rate_limited" | "not_found";
  claim_token: string | null;
  attempt_count: number;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  let admin: ReturnType<typeof createClient> | null = null;
  let claimedMessageId: string | null = null;
  let activeClaimToken: string | null = null;
  let pushAccepted = false;
  let failureReason = "dispatch_failed";

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!bearerToken) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    if (!supabaseUrl || !serviceRoleKey || !expoAccessToken) {
      throw new Error("Push notification service is not configured");
    }

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await admin.auth.getUser(bearerToken);
    const sender = authData.user;
    if (authError || !sender) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const requestData = await req.json().catch(() => null) as { messageId?: unknown } | null;
    const messageId = typeof requestData?.messageId === "string" ? requestData.messageId : "";
    if (!UUID_PATTERN.test(messageId)) {
      return jsonResponse({ success: false, error: "A valid messageId is required" }, 400);
    }

    const { data: message, error: messageError } = await admin
      .from("messages")
      .select("id, sender_id, receiver_id, text, created_at")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) throw messageError;
    if (!message) {
      return jsonResponse({ success: false, error: "Message not found" }, 404);
    }
    if (message.sender_id !== sender.id) {
      return jsonResponse({ success: false, error: "Forbidden" }, 403);
    }

    const messageAge = Date.now() - new Date(message.created_at).getTime();
    if (!Number.isFinite(messageAge) || messageAge < 0 || messageAge > MAX_MESSAGE_AGE_MS) {
      return jsonResponse({ success: false, error: "Message is outside the dispatch window" }, 409);
    }

    const { data: claimRows, error: claimError } = await admin.rpc(
      "claim_push_notification_dispatch",
      {
        p_message_id: message.id,
        p_max_per_minute: MAX_PUSHES_PER_MINUTE,
        p_stale_after_seconds: STALE_CLAIM_SECONDS,
      },
    );

    if (claimError) throw claimError;
    const claim = (Array.isArray(claimRows) ? claimRows[0] : claimRows) as ClaimResult | null;
    if (!claim) throw new Error("Push dispatch claim returned no result");

    if (claim.claim_status === "rate_limited") {
      return jsonResponse({ success: false, error: "Too many notification requests" }, 429);
    }
    if (claim.claim_status === "already_processed") {
      return jsonResponse({ success: true, sent: 0, alreadyProcessed: true });
    }
    if (claim.claim_status === "in_progress") {
      return jsonResponse({ success: true, sent: 0, processing: true }, 202);
    }
    if (claim.claim_status === "not_found") {
      return jsonResponse({ success: false, error: "Message not found" }, 404);
    }
    if (claim.claim_status !== "claimed" || !claim.claim_token) {
      throw new Error("Push dispatch claim was invalid");
    }

    claimedMessageId = message.id;
    activeClaimToken = claim.claim_token;

    failureReason = "receiver_lookup_failed";
    const { data: receiverProfile, error: receiverError } = await admin
      .from("profiles")
      .select("expo_push_token, notification_enabled, notification_preferences")
      .eq("id", message.receiver_id)
      .maybeSingle();

    if (receiverError) throw receiverError;
    const preferences = receiverProfile?.notification_preferences ?? {};
    const muted = Array.isArray(preferences.muted_conversations)
      ? preferences.muted_conversations.map(String)
      : [];
    const shouldSkip = !receiverProfile?.expo_push_token
      || receiverProfile.notification_enabled === false
      || preferences.messages === false
      || muted.includes(String(message.sender_id));

    if (shouldSkip) {
      failureReason = "skip_state_update_failed";
      const { data: skippedDispatch, error: skipError } = await admin
        .from("push_notification_dispatches")
        .update({ outcome: "skipped", last_error: null })
        .eq("message_id", message.id)
        .eq("claim_token", activeClaimToken)
        .eq("outcome", "claimed")
        .select("message_id")
        .maybeSingle();
      if (skipError) throw skipError;
      if (!skippedDispatch) throw new Error("Push dispatch lease was lost");
      return jsonResponse({ success: true, sent: 0 });
    }

    const { data: senderProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", message.sender_id)
      .maybeSingle();

    const text = String(message.text ?? "New message");
    const body = text.length > 100 ? `${text.slice(0, 97)}...` : text;
    failureReason = "expo_request_failed";
    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${expoAccessToken}`,
      },
      body: JSON.stringify({
        to: receiverProfile.expo_push_token,
        title: `${senderProfile?.display_name ?? "Someone"} sent you a message`,
        body,
        data: {
          type: "message",
          senderId: message.sender_id,
          receiverId: message.receiver_id,
          messageId: message.id,
        },
        priority: "high",
        sound: "default",
      }),
      signal: AbortSignal.timeout(EXPO_REQUEST_TIMEOUT_MS),
    });

    if (!pushResponse.ok) {
      failureReason = `expo_http_${pushResponse.status}`;
      throw new Error(`Expo push request failed with status ${pushResponse.status}`);
    }

    failureReason = "expo_response_invalid";
    const pushResult = await pushResponse.json();
    const ticket = Array.isArray(pushResult?.data) ? pushResult.data[0] : pushResult?.data;
    if (ticket?.status !== "ok") {
      failureReason = "expo_rejected";
      throw new Error("Expo rejected the push notification");
    }
    pushAccepted = true;

    failureReason = "sent_state_update_failed";
    const { data: sentDispatch, error: sentError } = await admin
      .from("push_notification_dispatches")
      .update({ outcome: "sent", sent_at: new Date().toISOString(), last_error: null })
      .eq("message_id", message.id)
      .eq("claim_token", activeClaimToken)
      .eq("outcome", "claimed")
      .select("message_id")
      .maybeSingle();
    if (sentError) throw sentError;
    if (!sentDispatch) throw new Error("Push dispatch lease was lost");

    return jsonResponse({ success: true, sent: 1 });
  } catch (error) {
    if (admin && claimedMessageId && activeClaimToken) {
      const terminalState = pushAccepted
        ? { outcome: "sent", sent_at: new Date().toISOString(), last_error: null }
        : { outcome: "failed", sent_at: null, last_error: failureReason.slice(0, 200) };
      const { error: stateError } = await admin
        .from("push_notification_dispatches")
        .update(terminalState)
        .eq("message_id", claimedMessageId)
        .eq("claim_token", activeClaimToken)
        .eq("outcome", "claimed");
      if (stateError) {
        console.error("Failed to update push dispatch state", stateError);
      }
    }
    console.error("Failed to dispatch push notification", error);
    return jsonResponse({ success: false, error: "Push notification failed" }, 500);
  }
});
