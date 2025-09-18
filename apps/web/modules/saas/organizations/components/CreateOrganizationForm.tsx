"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import {
	organizationListQueryKey,
	useCreateOrganizationMutation,
	useOrganizationListQuery,
} from "@saas/organizations/lib/api";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(3).max(32),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateOrganizationForm({
	defaultName,
}: {
	defaultName?: string;
}) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { setActiveOrganization } = useActiveOrganization();
	const { data: existingOrganizations, isLoading } =
		useOrganizationListQuery();
	const createOrganizationMutation = useCreateOrganizationMutation();
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: defaultName ?? "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ name }) => {
		try {
			const newOrganization =
				await createOrganizationMutation.mutateAsync({
					name,
				});

			if (!newOrganization) {
				throw new Error("Failed to create organization");
			}

			await setActiveOrganization(newOrganization.id);

			await queryClient.invalidateQueries({
				queryKey: organizationListQueryKey,
			});

			router.replace(`/app/${newOrganization.slug}`);
		} catch {
			toast.error(t("organizations.createForm.notifications.error"));
		}
	});

	// Check if user already has organizations
	const hasExistingOrganizations =
		existingOrganizations && existingOrganizations.length > 0;

	if (isLoading) {
		return (
			<div className="mx-auto w-full max-w-md">
				<p>Loading...</p>
			</div>
		);
	}

	if (hasExistingOrganizations) {
		return (
			<div className="mx-auto w-full max-w-md">
				<h1 className="font-bold text-xl md:text-2xl">
					{t("organizations.createForm.title")}
				</h1>

				<Alert className="mt-6">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Organization Limit Reached</AlertTitle>
					<AlertDescription>
						You are already a member of an organization. In
						PipeTrak, users can only belong to one organization at a
						time. If you need to join a different organization,
						please contact your administrator.
					</AlertDescription>
				</Alert>

				{existingOrganizations && existingOrganizations.length > 0 && (
					<div className="mt-4 p-4 border rounded-lg">
						<h3 className="font-semibold mb-2">
							Your Current Organization:
						</h3>
						<p className="text-sm text-foreground/70">
							{existingOrganizations[0].name}
						</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-md">
			<h1 className="font-bold text-xl md:text-2xl">
				{t("organizations.createForm.title")}
			</h1>
			<p className="mt-2 mb-6 text-foreground/60">
				{t("organizations.createForm.subtitle")}
			</p>

			<Form {...form}>
				<form onSubmit={onSubmit}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t("organizations.createForm.name")}
								</FormLabel>
								<FormControl>
									<Input {...field} autoComplete="email" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						className="mt-6 w-full"
						type="submit"
						loading={form.formState.isSubmitting}
					>
						{t("organizations.createForm.submit")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
