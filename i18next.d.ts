import 'i18next';
import type auth from 'public/locales/en/auth.json';
import type common from 'public/locales/en/common.json';
import type home from 'public/locales/en/home.json';

interface I18nNamespaces {
  common: typeof common;
  auth: typeof auth;
  home: typeof home;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
