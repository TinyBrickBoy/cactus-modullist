// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "Cactusmod Addons and Modpacks",
      htmlAttrs: { lang: "en" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Every Modrinth project (addons & modpacks) that depends on the Cactus Mod.",
        },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  runtimeConfig: {
    // Internal API origin (standalone server).
    // Overridable at runtime via the NUXT_API_ORIGIN env var.
    apiOrigin: "http://127.0.0.1:4000",
    public: {
      // Browser & SSR call the API through this path
      // -> the server route server/routes/api/[...].ts proxies it onwards.
      apiBase: "/api",
    },
  },
});
