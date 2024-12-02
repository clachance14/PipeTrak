"use client";

import { authClient } from "@repo/auth/client";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useRouter } from "@shared/hooks/router";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function DeleteAccountForm() {
	const t = useTranslations();
	const { toast } = useToast();
	const [deleting, setDeleting] = useState(false);
	const [password, setPassword] = useState("");
	const router = useRouter();
	const [showConfirmation, setShowConfirmation] = useState(false);

	const onDelete = async () => {
		setDeleting(true);
		await authClient.deleteUser(
			{
				password,
			},
			{
				onSuccess: () => {
					toast({
						variant: "success",
						title: t("settings.account.deleteAccount.notifications.success"),
					});
					router.replace("/");
				},
				onError: () => {
					toast({
						variant: "error",
						title: t("settings.account.deleteAccount.notifications.error"),
					});
				},
				onResponse: (response) => {
					setDeleting(false);
				},
			},
		);
	};

	return (
		<>
			<ActionBlock
				danger
				title={t("settings.account.deleteAccount.title")}
				onSubmit={() => setShowConfirmation(true)}
				submitLabel={t("settings.account.deleteAccount.submit")}
			>
				<p>{t("settings.account.deleteAccount.description")}</p>
			</ActionBlock>

			<AlertDialog
				open={showConfirmation}
				onOpenChange={(open) => setShowConfirmation(open)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-destructive">
							{t("settings.account.deleteAccount.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("settings.account.deleteAccount.confirmation")}

							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-4 w-full"
							/>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("common.confirmation.cancel")}
						</AlertDialogCancel>
						<Button
							variant="error"
							loading={deleting}
							onClick={async () => {
								await onDelete();
								setShowConfirmation(false);
							}}
						>
							{t("settings.account.deleteAccount.submit")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
