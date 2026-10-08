import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    // 1. Verify this request came from Supabase Database Webhook
    // You should set up a webhook secret in production
    
    const payload = await req.json();
    console.log("Webhook payload received:", payload);
    
    // Only handle INSERT events
    if (payload.type !== "INSERT" || payload.table !== "notifications") {
      return new Response("Not an insert event on notifications", { status: 400 });
    }

    const newNotification = payload.record;

    // 2. Initialize Supabase client to fetch the user's push token
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch the Expo Push Token for this user
    const { data: pushTokens, error } = await supabase
      .from('user_push_tokens')
      .select('token')
      .eq('user_id', newNotification.user_id);

    if (error || !pushTokens || pushTokens.length === 0) {
      console.log(`No push tokens found for user ${newNotification.user_id}`);
      return new Response("No push tokens found", { status: 200 });
    }

    // 4. Construct the Expo Push payloads
    const expoPushMessages = pushTokens.map(t => ({
      to: t.token,
      title: newNotification.title,
      body: newNotification.description,
      data: { 
        type: newNotification.type, 
        reference_id: newNotification.reference_id 
      },
      sound: "default",
    }));

    // 5. Send to Expo Push API
    const expoResponse = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expoPushMessages),
    });

    const expoData = await expoResponse.json();
    console.log("Expo Push API response:", expoData);

    return new Response(JSON.stringify({ success: true, expoResponse: expoData }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing push notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

