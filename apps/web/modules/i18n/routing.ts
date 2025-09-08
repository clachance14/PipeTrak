// Re-export routing config and navigation hooks from edge-compatible modules
export { routing } from "./edge-routing-config";
export {
	LocaleLink,
	localeRedirect,
	useLocalePathname,
	useLocaleRouter,
} from "./edge-routing-navigation";
