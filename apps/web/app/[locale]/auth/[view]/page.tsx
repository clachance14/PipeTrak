import { Auth, AuthView } from "./Auth";

export async function generateMetadata() {
  return {
    title: "Sign in",
  };
}

export default function AuthPage({
  params: { view },
}: {
  params: { view: AuthView };
}) {
  return <Auth view={view} />;
}
