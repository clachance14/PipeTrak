import { LocaleLink } from "@i18n/routing";

export function Footer() {
	return (
		<footer className="container pt-6 text-center text-muted-foreground text-xs">
			<span>
				© {new Date().getFullYear()} supastarter. All rights reserved.
			</span>
			<span className="opacity-50"> | </span>
			<LocaleLink href="/legal/privacy-policy">Privacy policy</LocaleLink>
			<span className="opacity-50"> | </span>
			<LocaleLink href="/legal/terms">Terms and conditions</LocaleLink>
		</footer>
	);
}
