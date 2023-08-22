import { ForgotPasswordForm } from "@saas/auth/components";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale, view } }) {
  const t = await getTranslator(locale, "auth");

  return {
    title: t("forgotPassword.title"),
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
