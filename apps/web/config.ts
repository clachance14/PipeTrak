export const appConfig = {
  i18n: {
    locales: ["en", "de", "es"],
    defaultLocale: "en",
    localeLabels: {
      en: "English",
      es: "Español",
      de: "Deutsch",
    },
  },
  auth: {
    redirectAfterLogin: "/dashboard",
    oAuthProviders: ["google", "github"],
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
  teams: {
    avatarColors: ["#425693", "#9170b4", "#7e91c9", "#6e90ba"],
  },
};
