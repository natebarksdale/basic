// Cloudflare Worker - OpenRouter API Proxy
// This worker acts as a secure proxy between your frontend and OpenRouter
// The API key never leaves the server, providing real security

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get the origin of the request
    const origin = request.headers.get('Origin');

    // Allow requests from your domains
    const allowedOrigins = [
      'https://natebarksdale.xyz',
      'https://natebarksdale.github.io',
      'http://localhost:8000',  // For local testing
      'http://127.0.0.1:8000'   // For local testing
    ];

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed =>
      origin && origin.startsWith(allowed)
    );

    if (!isAllowed) {
      console.log('Blocked request from:', origin);
      return new Response('Forbidden - Invalid origin', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }

    // Check if API key is configured
    if (!env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY environment variable not set');
      return new Response('Server configuration error', {
        status: 500,
        headers: corsHeaders(origin)
      });
    }

    try {
      // Parse the request body
      const body = await request.json();

      // Validate required fields
      if (!body.model || !body.messages) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: model and messages'
        }), {
          status: 400,
          headers: corsHeaders(origin)
        });
      }

      // Forward request to OpenRouter
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': origin || 'https://natebarksdale.xyz',
          'X-Title': 'Two Truths & A Lie Travel Guide'
        },
        body: JSON.stringify(body)
      });

      // Get the response
      const data = await openrouterResponse.json();

      // Return the response with CORS headers
      return new Response(JSON.stringify(data), {
        status: openrouterResponse.status,
        headers: corsHeaders(origin)
      });

    } catch (error) {
      console.error('Error proxying request:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders(origin)
      });
    }
  }
};

// CORS headers helper
function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// Handle CORS preflight
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
