import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function OrganizationInvitationInfo({
	className,
}: { className?: string }) {
	const t = useTranslations();
	return (
		<Alert variant="primary" className={className}>
			<MailCheckIcon className="size-6" />
			<AlertTitle>{t("organizations.organizationInvitation.title")}</AlertTitle>
			<AlertDescription>
				{t("organizations.organizationInvitation.description")}
			</AlertDescription>
		</Alert>
	);
}
