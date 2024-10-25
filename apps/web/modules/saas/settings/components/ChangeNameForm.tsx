"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useSession } from "@saas/auth/hooks/use-session";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { Input } from "@ui/components/input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeNameForm() {
	const { user, reloadSession } = useSession();
	const [submitting, setSubmitting] = useState(false);
	const { toast } = useToast();
	const t = useTranslations();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.name ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		setSubmitting(true);

		await authClient.updateUser(
			{ name },
			{
				onSuccess: () => {
					toast({
						variant: "success",
						title: t("settings.notifications.nameUpdated"),
					});

					reloadSession();
					form.reset({
						name,
					});
				},
				onError: () => {
					toast({
						variant: "error",
						title: t("settings.notifications.nameUpdateFailed"),
					});
				},
				onResponse: () => {
					setSubmitting(false);
				},
			},
		);
	});

	return (
		<ActionBlock
			title={t("settings.account.changeName.title")}
			onSubmit={onSubmit}
			isSubmitting={submitting}
			isSubmitDisabled={
				!form.formState.isValid || !form.formState.dirtyFields.name
			}
		>
			<Input type="text" className="max-w-sm" {...form.register("name")} />
		</ActionBlock>
	);
}
