"use client";
import { authClient } from "@repo/auth/client";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { organizationListQueryKey } from "@saas/organizations/lib/api";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@ui/components/input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ChangeOrganizationNameForm() {
	const t = useTranslations();
	const router = useRouter();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
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

					queryClient.invalidateQueries({
						queryKey: organizationListQueryKey,
					});
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
