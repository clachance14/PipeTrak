import { createNavigation } from "next-intl/navigation";
import { routing } from "./edge-routing-config";

export const {
	Link: LocaleLink,
	redirect: localeRedirect,
	usePathname: useLocalePathname,
	useRouter: useLocaleRouter,
} = createNavigation(routing);