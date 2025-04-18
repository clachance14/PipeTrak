"use client";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function TwoFactorBlock() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { user } = useSession();

	const { data: accounts, isPending } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			const { data, error } = await authClient.listAccounts();

			if (error) {
				throw error;
			}

			return data;
		},
	});

	const addPasskey = async () => {
		await authClient.passkey.addPasskey({
			fetchOptions: {
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: ["passkeys"] });
					toast.success(
						t(
							"settings.account.security.passkeys.notifications.addPasskey.success.title",
						),
					);
				},
				onError: () => {
					toast.error(
						t(
							"settings.account.security.passkeys.notifications.addPasskey.error.title",
						),
					);
				},
			},
		});
	};

	console.log(accounts);
	if (!accounts?.some((account) => account.provider === "credential")) {
		return null;
	}

	return (
		<SettingsItem
			title={t("settings.account.security.twoFactor.title")}
			description={t("settings.account.security.twoFactor.description")}
		>
			<div className="grid grid-cols-1 gap-2">
				<Button className="w-full" variant="light" onClick={addPasskey}>
					<PlusIcon className="mr-1.5 size-4" />
					Add passkey
				</Button>
			</div>
		</SettingsItem>
	);
}
