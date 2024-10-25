"use client";

import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { Button } from "@ui/components/button";
import { useTranslations } from "next-intl";
import { oAuthProviders } from "../constants/oauth-providers";

export function SocialSigninButton({
	provider,
	className,
}: {
	provider: keyof typeof oAuthProviders;
	className?: string;
}) {
	const t = useTranslations();
	const providerData = oAuthProviders[provider];

	return (
		<Button
			onClick={() => {
				authClient.signIn.social({
					provider,
					callbackURL: new URL(
						config.auth.redirectAfterSignIn,
						window.location.origin,
					).toString(),
				});
			}}
			variant="outline"
			type="button"
			className={className}
		>
			{providerData.icon && (
				<i className="mr-2 text-primary">
					<providerData.icon className="size-4" />
				</i>
			)}
			{providerData.name}
		</Button>
	);
}
