module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'", 
            "https:", 
            "wss:",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
            "https://apollo-server-landing-page.cdn.apollographql.com"
          ],
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://*.basemaps.cartocdn.com",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
            "https://apollo-server-landing-page.cdn.apollographql.com"
          ],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com"
          ],
          "font-src": [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com"
          ],
          "media-src": [
            "'self'",
            "blob:",
            "data:",
            "https://*.basemaps.cartocdn.com",
            "https://tile.openstreetmap.org",
            "https://*.tile.openstreetmap.org",
          ],
          "img-src": [
            "'self'",
            "blob:",
            "data:",
            "https://*.basemaps.cartocdn.com",
            "market-assets.strapi.io",
            "https://*.tile.openstreetmap.org",
            "https://unpkg.com/leaflet@1.9.4/dist/images/",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com"
          ],
        },
      },
    },
  },  
];
