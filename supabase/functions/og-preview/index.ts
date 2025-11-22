import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('') || url.searchParams.toString().replace('=', '');
    
    if (!code) {
      return new Response("Missing stream code", { status: 400 });
    }

    // Get stream data from database
    const { data, error } = await supabaseClient
      .from('stream_codes')
      .select('stream_data, is_active, expires_at')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data || !data.is_active) {
      return new Response("Stream not found", { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      return new Response("Stream expired", { status: 404 });
    }

    const streamData = data.stream_data;

    // Check if request is from a crawler/bot
    const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";
    const isCrawler = 
      userAgent.includes("bot") ||
      userAgent.includes("crawler") ||
      userAgent.includes("spider") ||
      userAgent.includes("facebookexternalhit") ||
      userAgent.includes("twitterbot") ||
      userAgent.includes("whatsapp") ||
      userAgent.includes("telegrambot") ||
      userAgent.includes("slackbot") ||
      userAgent.includes("linkedinbot");

    // If it's a regular user, redirect to the actual page
    if (!isCrawler) {
      const redirectUrl = streamData.type === 'multi'
        ? `${url.origin}/mvm?=${code}`
        : `${url.origin}/stream?=${code}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
        },
      });
    }

    // For multi-viewer
    if (streamData.type === 'multi') {
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi Viewer - JKT48 Connect</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="Multi Viewer - JKT48 Connect" />
  <meta property="og:description" content="Tonton multiple live streams JKT48 secara bersamaan!" />
  <meta property="og:image" content="${url.origin}/placeholder.svg" />
  <meta property="og:url" content="${url.origin}/mvm?=${code}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="JKT48 Connect" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Multi Viewer - JKT48 Connect" />
  <meta name="twitter:description" content="Tonton multiple live streams JKT48 secara bersamaan!" />
  <meta name="twitter:image" content="${url.origin}/placeholder.svg" />
  
  <meta http-equiv="refresh" content="1;url=/mvm?=${code}">
</head>
<body>
  <h1>Multi Viewer - JKT48 Connect</h1>
  <p>Tonton multiple live streams JKT48 secara bersamaan!</p>
  <script>
    window.location.href = "/mvm?=${code}";
  </script>
</body>
</html>`;
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // For single stream
    const { name, platform, title, image } = streamData;
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Live di ${platform.toUpperCase()} | JKT48 Connect</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${name} - Live Now!" />
  <meta property="og:description" content="${name} sedang live di ${platform.toUpperCase()}! ${title || ''}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url.origin}/stream?=${code}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="JKT48 Connect" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name} - Live Now!" />
  <meta name="twitter:description" content="${name} sedang live di ${platform.toUpperCase()}! ${title || ''}" />
  <meta name="twitter:image" content="${image}" />
  
  <!-- Additional Meta Tags -->
  <meta name="description" content="${name} sedang live di ${platform.toUpperCase()}! Tonton sekarang di JKT48 Connect." />
  
  <meta http-equiv="refresh" content="1;url=/stream?=${code}">
</head>
<body>
  <h1>${name} - Live Now!</h1>
  <p>Sedang live di ${platform.toUpperCase()}</p>
  <p>${title || ''}</p>
  <p>Redirecting to player...</p>
  <script>
    window.location.href = "/stream?=${code}";
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });

  } catch (error) {
    console.error('Error in og-preview function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
