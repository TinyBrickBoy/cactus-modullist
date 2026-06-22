// Proxies every /api/** request onwards to the internal standalone API.
// The target comes from runtimeConfig.apiOrigin (env: NUXT_API_ORIGIN).
export default defineEventHandler((event) => {
  const { apiOrigin } = useRuntimeConfig(event);

  const path = (getRouterParam(event, "path") || "").replace(/^\/+/, "");
  const query = getRequestURL(event).search;
  const target = `${apiOrigin}/${path}${query}`;

  return proxyRequest(event, target);
});
