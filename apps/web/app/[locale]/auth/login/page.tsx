import { LoginForm } from "@components/auth";
import { getTranslator } from "next-intl/server";

export async function generateMetadata({ params: { locale, view } }) {
  const t = await getTranslator(locale, "auth");

  return {
    title: t("login.title"),
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
