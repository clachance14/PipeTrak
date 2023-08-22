export const appConfig = {
  i18n: {
    locales: ["en", "de", "es"],
    defaultLocale: "en",
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
    avatarColors: ["#9cd9aa", "#bd6565", "#b5e5c5", "#bd6565"],
  },
};
