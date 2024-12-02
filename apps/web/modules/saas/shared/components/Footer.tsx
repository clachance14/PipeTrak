import { LocaleLink } from "@i18n/routing";
import { config } from "@repo/config";
import { cn } from "@ui/lib";

export function Footer() {
	return (
		<footer
			className={cn(
				"container max-w-6xl py-6 text-center text-muted-foreground text-xs",
				[config.ui.saas.useSidebarLayout ? "ml-0" : ""],
			)}
		>
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
