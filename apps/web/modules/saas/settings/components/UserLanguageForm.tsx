"use client";

import { updateLocale } from "@i18n/lib/update-locale";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import type { Locale } from "@repo/i18n";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useToast } from "@ui/hooks/use-toast";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const { locales } = config.i18n;

export function UserLanguageForm() {
	const { toast } = useToast();
	const currentLocale = useLocale();
	const t = useTranslations();
	const router = useRouter();
	const [locale, setLocale] = useState<Locale | undefined>(
		currentLocale as Locale,
	);

	const onSubmit = async () => {
		if (!locale) {
			return;
		}
		try {
			await authClient.updateUser({
				locale,
			});
			await updateLocale(locale);
			router.refresh();

			toast({
				variant: "success",
				title: t("settings.account.language.notifications.success"),
			});
		} catch {
			toast({
				variant: "error",
				title: t("settings.account.language.notifications.error"),
			});
		}
	};

	return (
		<ActionBlock
			title={t("settings.account.language.title")}
			onSubmit={onSubmit}
			isSubmitDisabled={locale === currentLocale}
		>
			<div className="flex flex-col items-stretch gap-4">
				<p className="text-muted-foreground text-sm">
					{t("settings.account.language.description")}
				</p>

				<Select
					value={locale}
					onValueChange={(value) => setLocale(value as Locale)}
				>
					<SelectTrigger className="max-w-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(locales).map(([key, value]) => (
							<SelectItem key={key} value={key}>
								{value.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</ActionBlock>
	);
}
