import langParser from "accept-language-parser";
import { NextRequest, NextResponse } from "next/server";

// helper function to get the browser language from request headers
export function getBrowserLanguage(
  acceptLangHeader: string,
  langs: string[],
  defaultLocale: string = langs[0],
) {
  return langParser.pick(langs, acceptLangHeader) || defaultLocale;
}

// middleware helper to handle language detection
export function handleLanguageDetection(
  req: NextRequest,
  {
    acceptLangHeader,
    defaultLocale,
    locales,
  }: {
    acceptLangHeader?: string;
    defaultLocale: string;
    locales: string[];
  },
) {
  const pathname = req.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  console.log(pathname, pathnameIsMissingLocale);

  if (pathnameIsMissingLocale) {
    const browserLang = getBrowserLanguage(
      acceptLangHeader ?? "",
      locales,
      defaultLocale,
    );

    const langCookie = req.cookies.get("lang")?.value;
    const lang = langCookie || browserLang || defaultLocale;
    const response = NextResponse.next();

    console.log("new language", lang);

    response.cookies.set("lang", lang);
    const redirectUrl = new URL(`/${lang}${pathname}`, req.url);
    console.log("redirecting to", redirectUrl.href);

    // return NextResponse.redirect(redirectUrl);
  }
}
