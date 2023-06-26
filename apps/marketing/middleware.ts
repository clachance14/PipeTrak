import { handleLanguageDetection } from "i18n/utils";
import { NextRequest } from "next/server";
import i18n from "./i18n";

export function middleware(req: NextRequest) {
  const response = handleLanguageDetection(req, {
    ...i18n,
    acceptLangHeader: req.headers.get("accept-language"),
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/"],
};
