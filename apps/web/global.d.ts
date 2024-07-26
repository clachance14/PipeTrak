import type { Messages } from "i18n/types";

declare global {
	// Use type safe message keys with `next-intl`
	interface IntlMessages extends Messages {}
}
