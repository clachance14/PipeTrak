"use client";

import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useSignedUploadUrlMutation } from "@saas/shared/lib/api";
import { Spinner } from "@shared/components/Spinner";
import { useRouter } from "@shared/hooks/router";
import { useToast } from "@ui/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuid } from "uuid";
import { CropImageDialog } from "../../settings/components/CropImageDialog";
import { useOrganization } from "../hooks/use-organization";
import { OrganizationAvatar } from "./OrganizationAvatar";

export function OrganizationAvatarForm() {
	const { toast } = useToast();
	const router = useRouter();
	const t = useTranslations();
	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [image, setImage] = useState<File | null>(null);
	const { activeOrganization } = useOrganization();

	const getSignedUploadUrlMutation = useSignedUploadUrlMutation();

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: (acceptedFiles) => {
			setImage(acceptedFiles[0]);
			setCropDialogOpen(true);
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
		},
		multiple: false,
	});

	if (!activeOrganization) {
		return null;
	}

	const onCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) {
			return;
		}

		setUploading(true);
		try {
			const path = `${activeOrganization.id}-${uuid()}.png`;
			const { signedUrl } = await getSignedUploadUrlMutation.mutateAsync({
				path,
				bucket: config.storage.bucketNames.avatars,
			});

			const response = await fetch(signedUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: {
					"Content-Type": "image/png",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to upload image");
			}

			await authClient.organization.update({
				organizationId: activeOrganization.id,
				data: {
					logo: path,
				},
			});

			toast({
				variant: "success",
				title: t("settings.notifications.avatarUpdated"),
			});

			router.refresh();
		} catch (e) {
			toast({
				variant: "error",
				title: t("settings.notifications.avatarNotUpdated"),
			});
		} finally {
			setUploading(false);
		}
	};

	return (
		<ActionBlock title={t("settings.account.avatar.title")}>
			<div className="flex items-center gap-4">
				<div>
					<p>{t("settings.account.avatar.description")}</p>
				</div>

				<div className="relative rounded-full" {...getRootProps()}>
					<input {...getInputProps()} />
					<OrganizationAvatar
						className="size-24 cursor-pointer text-xl"
						avatarUrl={activeOrganization.logo}
						name={activeOrganization.name ?? ""}
					/>

					{uploading && (
						<div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90">
							<Spinner className="size-6" />
						</div>
					)}
				</div>
			</div>

			<CropImageDialog
				image={image}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
			/>
		</ActionBlock>
	);
}
