export const appConfig = {
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
  },
  auth: {
    redirectAfterLogin: "/dashboard",
  },
  marketing: {
    menu: [
      {
        translationKey: "pricing",
        href: "/pricing",
      },
      {
        translationKey: "blog",
        href: "/Blog",
      },
    ],
  },
};
