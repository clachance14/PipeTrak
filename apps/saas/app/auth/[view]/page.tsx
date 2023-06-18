import { AuthView } from "auth";
import { Auth } from "auth/components";
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
  if (!Object.values(AuthView).includes(view as AuthView)) {
    redirect("/");
  }

  return (
    <Auth
      view={view}
      paths={{
        signin: "/auth/signin",
        signup: "/auth/signup",
        "forgot-password": "/auth/forgot-password",
        "reset-password": "/auth/reset-password",
      }}
    />
  );
}
