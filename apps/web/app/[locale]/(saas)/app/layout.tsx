import { UserContextProvider } from "@saas/auth/lib/user-context";
import { Footer } from "@saas/shared/components/Footer";
import { NavBar } from "@saas/shared/components/NavBar";
import { CURRENT_TEAM_ID_COOKIE_NAME } from "@saas/shared/constants";
import { createApiCaller } from "api/trpc/caller";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({ children }: PropsWithChildren) {
  const apiCaller = await createApiCaller();
  const currentTeamId = cookies().get(CURRENT_TEAM_ID_COOKIE_NAME)?.value;

  const user = await apiCaller.auth.user();

  if (!user) {
    return redirect("/auth/login");
  }

  if (!user.onboardingComplete) {
    return redirect("/onboarding");
  }

  const teamMemberships = user.teamMemberships ?? [];

  // if user has no team memberships, we create a team for them
  if (!teamMemberships.length) {
    return redirect("/onboarding");
  }

  const currentTeamMembership =
    teamMemberships.find(
      (membership) => membership.team.id === currentTeamId,
    ) ?? teamMemberships[0];

  if (!currentTeamMembership) {
    return redirect("/");
  }

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
        <Footer />
      </div>
    </UserContextProvider>
  );
}
