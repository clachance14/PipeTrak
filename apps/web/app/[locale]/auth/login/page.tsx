import { getTranslator } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export async function generateMetadata({ params: { locale, view } }) {
  const t = await getTranslator(locale, "auth");

  return {
    title: t("login.title"),
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
