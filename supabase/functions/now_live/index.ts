import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const group = url.searchParams.get("group") || "jkt48";

    const upstreamResponse = await fetch(`https://api.crstlnz.my.id/api/now_live?group=${group}`);

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error("Upstream API error:", upstreamResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch upstream data" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await upstreamResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in now_live function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
