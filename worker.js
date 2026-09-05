export default {
  async fetch(request, env) {
    try {
      const response = await env.ASSETS.fetch(request);
      if (response && response.status === 404) {
        const url = new URL(request.url);
        url.pathname = '/index.html';
        return await env.ASSETS.fetch(new Request(url.toString(), request));
      }
      return response;
    } catch (err) {
      try {
        const url = new URL(request.url);
        url.pathname = '/index.html';
        return await env.ASSETS.fetch(new Request(url.toString(), request));
      } catch (innerErr) {
        return new Response('CampRoo App Error', { status: 500 });
      }
    }
  }
};
