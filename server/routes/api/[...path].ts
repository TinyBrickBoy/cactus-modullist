// Proxyt alle /api/**-Anfragen an die interne Standalone-API weiter.
// Das Ziel kommt aus runtimeConfig.apiOrigin (ENV: NUXT_API_ORIGIN).
export default defineEventHandler((event) => {
  const { apiOrigin } = useRuntimeConfig(event);

  const path = (getRouterParam(event, "path") || "").replace(/^\/+/, "");
  const query = getRequestURL(event).search;
  const target = `${apiOrigin}/${path}${query}`;

  return proxyRequest(event, target);
});
