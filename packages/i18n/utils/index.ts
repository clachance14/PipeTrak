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
  // first we get the lang that should be used
  // by 1. checking the query params
  //    2. checking the cookie
  //    3. using the accept-language header
  //    4. using the default locale

  const browserLang = getBrowserLanguage(
    acceptLangHeader ?? "",
    locales,
    defaultLocale,
  );
  const langParam = req.nextUrl.searchParams.get("lang");
  const langCookie = req.cookies.get("lang")?.value;
  const lang = langParam || langCookie || browserLang || defaultLocale;
  const response = NextResponse.next();

  if (!lang) {
    return response;
  }

  if (lang !== langCookie) {
    response.cookies.set("lang", lang);
  }

  if (!langParam && lang !== defaultLocale) {
    req.nextUrl.searchParams.set("lang", lang);
    return NextResponse.redirect(req.nextUrl);
  }

  return response;
}
