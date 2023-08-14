import { Sidebar } from "@components";
import { createApiCaller } from "api";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function Layout({
  children,
  params: { teamSlug },
}: PropsWithChildren<{ params: { teamSlug: string } }>) {
  const apiCaller = await createApiCaller();
  const { user, teams, role } = await apiCaller.user.claims();

  if (!user) {
    redirect("/auth/login");
  }

  const team = teams.find((team) => team.team.slug === teamSlug);

  if (!team) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex">
      <Sidebar teams={teams.map(({ team }) => team)} />
      <main className="bg-card border-border mt-2 min-h-screen flex-1 rounded-tl-xl border px-8 py-12 transition-all duration-300 ease-in-out lg:ml-[300px]">
        {children}
      </main>
    </div>
  );
}
