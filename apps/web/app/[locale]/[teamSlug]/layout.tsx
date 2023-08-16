import { LoadingWrapper, Sidebar } from "@components";
import { createApiCaller } from "api";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function Layout({
  children,
  params: { teamSlug },
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const apiCaller = await createApiCaller();
  const user = await apiCaller.user.info();
  const teams = await apiCaller.user.teams();

  if (!user) {
    redirect("/auth/login");
  }

  const team = teams.find((team) => team.slug === teamSlug);

  if (!team) {
    redirect("/");
  }

  return (
    <LoadingWrapper>
      <div className="bg-muted flex">
        <Sidebar teams={teams} />
        <main className="bg-card border-border mt-2 min-h-screen flex-1 rounded-tl-xl border px-8 py-12 transition-all duration-300 ease-in-out lg:ml-[300px]">
          {children}
        </main>
      </div>
    </LoadingWrapper>
  );
}
