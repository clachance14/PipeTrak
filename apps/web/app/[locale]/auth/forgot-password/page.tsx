import { getTranslator } from "next-intl/server";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export async function generateMetadata({ params: { locale, view } }) {
  const t = await getTranslator(locale, "auth");

  return {
    title: t("forgotPassword.title"),
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
