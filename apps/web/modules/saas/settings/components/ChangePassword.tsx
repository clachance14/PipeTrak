"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { useRouter } from "@shared/hooks/router";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { PasswordInput } from "@ui/components/password-input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string(),
});

export function ChangePasswordForm() {
	const t = useTranslations();
	const { toast } = useToast();
	const router = useRouter();
	const [password, setPassword] = useState("");
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) =>
		authClient.changePassword(
			{
				...values,
				revokeOtherSessions: true,
			},
			{
				onSuccess: () => {
					toast({
						variant: "success",
						title: t("settings.notifications.passwordUpdated"),
					});
					setPassword("");
					router.refresh();
				},
				onError: () => {
					toast({
						variant: "error",
						title: t("settings.notifications.passwordNotUpdated"),
					});
				},
			},
		),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("settings.account.security.changePassword.title")}
				</CardTitle>
			</CardHeader>
			<Form {...form}>
				<CardContent>
					<form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
						<FormField
							control={form.control}
							name="currentPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t(
											"settings.account.security.changePassword.currentPassword",
										)}
									</FormLabel>

									<FormControl>
										<PasswordInput {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("settings.account.security.changePassword.newPassword")}
									</FormLabel>
									<FormControl>
										<PasswordInput {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className=" mt-6 flex justify-end border-t pt-3">
							<Button type="submit">{t("settings.save")}</Button>
						</div>
					</form>
				</CardContent>
			</Form>
		</Card>
	);
}
