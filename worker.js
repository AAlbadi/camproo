export default {
  async fetch(request, env) {
    try {
      // 1. Try serving exact static file
      const response = await env.ASSETS.fetch(request);
      
      // 2. If static file found (200, 304, etc.), return it
      if (response && response.status !== 404 && response.status !== 405) {
        return response;
      }
      
      // 3. For 404s (SPA client routes like /admin, /explore, /trips), serve /index.html cleanly with GET
      const indexUrl = new URL('/index.html', request.url);
      return await env.ASSETS.fetch(new Request(indexUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'text/html' }
      }));
    } catch (err) {
      try {
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl.toString(), {
          method: 'GET'
        }));
      } catch (innerErr) {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CampRoo</title><script>window.location.href="/";</script></head><body>Redirecting to CampRoo...</body></html>',
          { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
        );
      }
    }
  }
};
