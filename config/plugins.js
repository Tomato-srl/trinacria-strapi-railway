module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET"),
    },
  },
  upload: {
    config: {
      provider: "local",
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
  i18n: {
    enabled: true,
    defaultLocale: 'it',
    locales: ['it'],
  },
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
        introspection: true,
        playground: true,
      },
    },
  },
});
