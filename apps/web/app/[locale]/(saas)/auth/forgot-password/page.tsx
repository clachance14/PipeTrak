import { ForgotPasswordForm } from "@saas/auth/components";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("auth.forgotPassword.title"),
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
