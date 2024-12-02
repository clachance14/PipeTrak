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
	email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

export function ChangeEmailForm() {
	const { user, reloadSession } = useSession();
	const [submitting, setSubmitting] = useState(false);
	const { toast } = useToast();
	const t = useTranslations();

	const form = useForm<FormSchema>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user?.email ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		setSubmitting(true);

		await authClient.changeEmail(
			{ newEmail: email },
			{
				onSuccess: () => {
					toast({
						variant: "success",
						title: t("settings.account.changeEmail.notifications.success"),
					});

					reloadSession();
				},
				onError: () => {
					toast({
						variant: "error",
						title: t("settings.account.changeEmail.notifications.error"),
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
			title={t("settings.account.changeEmail.title")}
			onSubmit={onSubmit}
			isSubmitting={submitting}
			isSubmitDisabled={
				!form.formState.isValid || !form.formState.dirtyFields.email
			}
		>
			<Input type="email" className="max-w-sm" {...form.register("email")} />
		</ActionBlock>
	);
}
