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
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useOrganizationMemberRoles } from "../hooks/use-organization-member-roles";

const formSchema = z.object({
	email: z.string().email(),
	role: z.enum(["member", "owner", "admin"]),
});

type FormValues = z.infer<typeof formSchema>;

export function InviteMemberForm({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const router = useRouter();
	const { toast } = useToast();
	const organizationMemberRoles = useOrganizationMemberRoles();

	const roleOptions = Object.entries(organizationMemberRoles).map(
		([value, label]) => ({
			value,
			label,
		}),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			await authClient.organization.inviteMember({
				...values,
				organizationId,
			});
			form.reset();
			router.refresh();

			toast({
				title: t(
					"organizations.settings.members.inviteMember.notifications.success.title",
				),
				description: t(
					"organizations.settings.members.inviteMember.notifications.success.description",
				),
				variant: "success",
			});
		} catch {
			toast({
				title: t(
					"organizations.settings.members.inviteMember.notifications.error.title",
				),
				description: t(
					"organizations.settings.members.inviteMember.notifications.error.description",
				),
				variant: "error",
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{t("organizations.settings.members.inviteMember.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="@container">
						<div className="flex @md:flex-row flex-col gap-2">
							<div className="flex-1">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("organizations.settings.members.inviteMember.email")}
											</FormLabel>
											<FormControl>
												<Input type="email" {...field} />
											</FormControl>
										</FormItem>
									)}
								/>
							</div>

							<div>
								<FormField
									control={form.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("organizations.settings.members.inviteMember.role")}
											</FormLabel>
											<FormControl>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<SelectTrigger className="w-[180px]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{roleOptions.map((option) => (
															<SelectItem
																key={option.value}
																value={option.value}
															>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						</div>

						<div className="mt-6 flex justify-end border-t pt-3">
							<Button type="submit" loading={form.formState.isSubmitting}>
								{t("organizations.settings.members.inviteMember.submit")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
