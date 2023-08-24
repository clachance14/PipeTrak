import { Sidebar } from "@saas/shared/components";
import { ApiOutput, createApiCaller } from "api";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function Layout({
  children,
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const apiCaller = await createApiCaller();
  const user = (await apiCaller.user.me()) as Required<ApiOutput["user"]["me"]>;

  if (!user) {
    return redirect("/auth/login");
  }

  const teams = await apiCaller.user.teams({ userId: user.id });

  return (
    <div className="bg-muted flex">
      <Sidebar user={user} teams={teams} />
      <main className="bg-card border-border mt-2 min-h-screen flex-1 rounded-tl-xl border px-8 py-12 transition-all duration-300 ease-in-out lg:ml-[300px]">
        {children}
      </main>
    </div>
  );
}
