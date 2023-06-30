import { appConfig } from "@config";
import createMiddleware from "next-intl/middleware";

export default createMiddleware(appConfig.i18n);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
