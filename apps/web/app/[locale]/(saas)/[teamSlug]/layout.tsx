import { NavBar } from "@saas/shared/components";
import { createApiCaller } from "api";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function Layout({
  children,
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.me();

  if (!user) return redirect("/auth/login");

  const teams = await apiCaller.user.teams({ userId: user.id });

  return (
    <div>
      <NavBar user={user} teams={teams} />
      <main className="bg-muted min-h-screen">{children}</main>
    </div>
  );
}
