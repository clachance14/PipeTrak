"use client";
import { authClient } from "@repo/auth/client";
import {
	type OAuthProvider,
	oAuthProviders,
} from "@saas/auth/constants/oauth-providers";
import { useRouter } from "@shared/hooks/router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {} from "@ui/components/form";
import { Skeleton } from "@ui/components/skeleton";
import { useToast } from "@ui/hooks/use-toast";
import { LinkIcon, UnlinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

const formSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string(),
});

export function ConnectedAccountsBlock() {
	const t = useTranslations();
	const { toast } = useToast();
	const router = useRouter();

	const { data, isPending } = useQuery({
		queryKey: ["userAccounts"],
		queryFn: async () => {
			const { data, error } = await authClient.listAccounts();

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const isProviderLinked = (provider: OAuthProvider) =>
		data?.some((account) => account.provider === provider);

	const linkProvider = (provider: OAuthProvider) => {
		const callbackURL = window.location.href;
		if (!isProviderLinked(provider)) {
			authClient.linkSocial({
				provider,
				callbackURL,
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("settings.account.security.connectedAccounts.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 divide-y">
					{Object.entries(oAuthProviders).map(([provider, providerData]) => {
						const isLinked = isProviderLinked(provider as OAuthProvider);

						return (
							<div
								key={provider}
								className="flex items-center justify-between gap-2 py-2"
							>
								<div className="flex items-center gap-2">
									<providerData.icon className="size-4 text-primary" />
									<span>{providerData.name}</span>
								</div>
								{isPending ? (
									<Skeleton className="h-9 w-28" />
								) : (
									<Button
										variant={isLinked ? "outline" : "secondary"}
										onClick={() => linkProvider(provider as OAuthProvider)}
									>
										{isLinked ? (
											<>
												<UnlinkIcon className="mr-1.5 size-4" />
												<span>
													{t(
														"settings.account.security.connectedAccounts.disconnect",
													)}
												</span>
											</>
										) : (
											<>
												<LinkIcon className="mr-1.5 size-4" />
												<span>
													{t(
														"settings.account.security.connectedAccounts.connect",
													)}
												</span>
											</>
										)}
									</Button>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
