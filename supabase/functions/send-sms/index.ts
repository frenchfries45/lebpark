import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BROADNET_BASE_URL = "https://gw3s.broadnet.me:8443/websmpp/websms";

function formatPhoneForBroadnet(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/[^\d]/g, "");

  // If starts with 0, remove the 0 and prepend 961
  if (cleaned.startsWith("0")) {
    cleaned = "961" + cleaned.substring(1);
  } else if (!cleaned.startsWith("961")) {
    // If doesn't already have country code, add 961
    cleaned = "961" + cleaned;
  }

  return cleaned;
}

async function sendSms(phone: string, text: string, smsUser: string, smsPass: string, smsSid: string): Promise<string> {
  const formattedPhone = formatPhoneForBroadnet(phone);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const type = hasArabic ? "4" : "1";

  // Build URL as raw string — avoids URLSearchParams encoding $ in password or spaces in text
  const smsUrl = `${BROADNET_BASE_URL}?user=${smsUser}&pass=${smsPass}&sid=${smsSid}&mno=${formattedPhone}&type=${type}&text=${encodeURIComponent(text)}`;

  console.log("Sending SMS to", formattedPhone);
  console.log("Full URL:", smsUrl.replace(smsPass, "***"));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(smsUrl, { signal: controller.signal });
  clearTimeout(timeoutId);
  return await response.text();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipients } = await req.json();
    console.log("Received request with", recipients?.length, "recipients");

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smsUser = Deno.env.get("BROADNET_SMS_USER");
    const smsPass = Deno.env.get("BROADNET_SMS_PASS");
    const smsSid = Deno.env.get("BROADNET_SMS_SID");

    if (!smsUser || !smsPass || !smsSid) {
      return new Response(JSON.stringify({ error: "SMS credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { phone: string; success: boolean; response?: string; error?: string }[] = [];

    for (const recipient of recipients) {
      const { phone, text } = recipient;

      try {
        const responseText = await sendSms(phone, text, smsUser, smsPass, smsSid);
        console.log("SMS response for", phone, ":", responseText);

        if (responseText.startsWith("ERROR")) {
          results.push({ phone, success: false, error: responseText });
        } else {
          results.push({ phone, success: true, response: responseText });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("SMS send failed for", phone, ":", errMsg);
        results.push({ phone, success: false, error: errMsg });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ success: true, successCount, failCount, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("SMS send error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
