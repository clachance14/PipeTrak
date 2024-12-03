import { useTranslations } from "next-intl";

export function useAuthErrorMessages() {
	const t = useTranslations();

	const authErrorMessages = {
		INVALID_EMAIL_OR_PASSWORD: t("auth.errors.invalidEmailOrPassword"),
	};

	const getAuthErrorMessage = (errorCode: string | undefined) => {
		return (
			authErrorMessages[errorCode as keyof typeof authErrorMessages] ||
			t("auth.errors.unknown")
		);
	};

	return {
		getAuthErrorMessage,
	};
}
