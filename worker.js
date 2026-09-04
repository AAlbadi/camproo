export default {
  async fetch(request, env) {
    // All routing is handled by the static assets binding (SPA fallback to index.html)
    return env.ASSETS.fetch(request);
  }
};
