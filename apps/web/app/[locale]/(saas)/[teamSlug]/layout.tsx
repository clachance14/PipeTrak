import { NavBar } from "@saas/shared/components";
import { createApiCaller } from "api";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({
  children,
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.me();

  if (!user) return redirect("/auth/login");

  const teams = await apiCaller.user.teams({ userId: user.id });

  return (
    <div className="bg-muted min-h-screen">
      <NavBar user={user} teams={teams} />
      <main className="bg-muted">{children}</main>
    </div>
  );
}
