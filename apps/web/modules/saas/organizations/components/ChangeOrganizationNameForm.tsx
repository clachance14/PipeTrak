"use client";
import { authClient } from "@repo/auth/client";
import { useOrganization } from "@saas/organizations/hooks/use-organization";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useRouter } from "@shared/hooks/router";
import { Input } from "@ui/components/input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ChangeOrganizationNameForm() {
	const t = useTranslations();
	const router = useRouter();
	const { toast } = useToast();
	const { activeOrganization, refetchAllOrganizations } = useOrganization();
	const [submitting, setSubmitting] = useState(false);
	const [name, setName] = useState(activeOrganization?.name);

	if (!activeOrganization) {
		return null;
	}

	const onSubmit = async () => {
		setSubmitting(true);
		await authClient.organization.update(
			{
				organizationId: activeOrganization.id,
				data: {
					name,
				},
			},
			{
				onSuccess: async () => {
					toast({
						variant: "success",
						title: t(
							"organizations.settings.notifications.organizationNameUpdated",
						),
					});

					await refetchAllOrganizations();
					router.refresh();
				},
				onError: () => {
					toast({
						variant: "error",
						title: t(
							"organizations.settings.notifications.organizationNameNotUpdated",
						),
					});
				},
				onResponse: () => {
					setSubmitting(false);
				},
			},
		);
	};

	return (
		<ActionBlock
			title={t("organizations.settings.changeName.title")}
			onSubmit={onSubmit}
			isSubmitting={submitting}
			isSubmitDisabled={!name}
		>
			<Input
				className="max-w-sm"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
		</ActionBlock>
	);
}
