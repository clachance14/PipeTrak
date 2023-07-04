import { AuthView } from "auth";
import { Auth } from "auth-client";
import { useLocale } from "next-intl";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Sign in",
  };
}

export default function AuthPage({
  params: { view },
  searchParams: { redirectTo },
}: {
  params: { view: AuthView };
  searchParams: { redirectTo?: string };
}) {
  const locale = useLocale();

  if (!Object.values(AuthView).includes(view as AuthView)) {
    redirect("/");
  }

  return (
    <Auth
      view={view}
      redirectIfAuthenticated="/"
      paths={{
        signin: `/${locale}/auth/signin`,
        signup: `/${locale}/auth/signup`,
        "forgot-password": `/${locale}/auth/forgot-password`,
        "reset-password": `/${locale}/auth/reset-password`,
      }}
    />
  );
}
