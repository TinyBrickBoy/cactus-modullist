// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "Cactus Addons & Modpacks",
      htmlAttrs: { lang: "de" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Alle Modrinth-Projekte (Addons & Modpacks), die von der Cactus Mod abhaengen.",
        },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  runtimeConfig: {
    // Interner API-Origin (Standalone-Server).
    // Zur Laufzeit per ENV NUXT_API_ORIGIN ueberschreibbar.
    apiOrigin: "http://127.0.0.1:4000",
    public: {
      // Browser & SSR rufen die API ueber diesen Pfad auf
      // -> die Server-Route server/routes/api/[...].ts proxyt weiter.
      apiBase: "/api",
    },
  },
});
