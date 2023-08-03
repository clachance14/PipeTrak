import { redirect } from "next/navigation";
import { Auth, AuthView } from "./Auth";

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

  return <Auth view={view} />;
}
