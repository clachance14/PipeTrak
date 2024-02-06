import { UserContextProvider } from "@saas/auth/lib/user-context";
import { NavBar } from "@saas/shared/components/NavBar";
import { TEAM_SLUG_COOKIE_NAME } from "@saas/shared/constants";
import { createApiCaller } from "api/trpc/caller";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({ children }: PropsWithChildren) {
  const apiCaller = await createApiCaller();
  const teamSlug = cookies().get(TEAM_SLUG_COOKIE_NAME)?.value;

  const user = await apiCaller.auth.user();

  if (!user) return redirect("/auth/login");

  const teamMemberships = user.teamMemberships ?? [];

  // if user has no team memberships, we create a team for them
  if (!teamMemberships.length) {
    try {
      const name = user.name || user.email.split("@")[0];
      const team = await apiCaller.team.create({
        name,
      });

      teamMemberships.push({
        ...team.memberships.at(0)!,
        user_id: user.id,
        team_id: team.id,
        team,
      });
    } catch (e) {
      console.error(e);
      redirect("/");
    }
  }

  const currentTeamMembership =
    teamMemberships.find((membership) => membership.team.slug === teamSlug) ??
    teamMemberships[0];

  if (!currentTeamMembership) return redirect("/");

  return (
    <UserContextProvider
      initialUser={user}
      teamMembership={currentTeamMembership}
    >
      <div className="bg-muted min-h-screen">
        <NavBar
          user={user}
          teams={teamMemberships?.map((membership) => membership.team) ?? []}
        />
        <main className="bg-muted">{children}</main>
      </div>
    </UserContextProvider>
  );
}
