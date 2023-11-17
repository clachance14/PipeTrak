import { TEAM_SLUG_COOKIE_NAME } from "@saas/shared/types";
import { createApiCaller } from "api";
import { Team } from "database";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const apiCaller = await createApiCaller();

  const redirectTo = requestUrl.searchParams.get("redirectTo") || null;

  const getRedirectPath = ({
    teamSlug,
    path,
  }: {
    teamSlug?: string;
    path: string;
  }) => {
    let redirectPath = redirectTo ?? path;
    if (teamSlug && redirectPath.includes("[teamSlug]"))
      redirectPath = redirectPath.replace("[teamSlug]", teamSlug);

    return redirectPath;
  };

  try {
    const user = await apiCaller.auth.user();

    if (!user) {
      let redirectPath = "/auth/login";
      if (redirectTo) redirectPath += `?redirectTo=${redirectTo}`;
      redirect(redirectPath);
    }

    const { teamMemberships } = user;

    // if user has no teams, we create one for them
    if (!teamMemberships || !teamMemberships.length) {
      let team: Team | undefined = undefined;

      try {
        const name = user.name || user.email.split("@")[0];
        team = await apiCaller.team.create({
          name,
        });
      } catch (e) {
        console.error(e);
        redirect("/");
      }

      redirect(
        getRedirectPath({
          teamSlug: team.slug,
          path: "/[teamSlug]/dashboard",
        }),
      );
    }

    // check cookie for latest team
    const teamSlugCookie = cookies().get(TEAM_SLUG_COOKIE_NAME)?.value;

    if (teamSlugCookie) {
      const teamMembership = teamMemberships.find(
        (membership) => membership.team.slug === teamSlugCookie,
      );

      if (teamMembership) {
        redirect(
          getRedirectPath({
            teamSlug: teamMembership.team.slug,
            path: "/[teamSlug]/dashboard",
          }),
        );
      }
    }

    redirect(
      getRedirectPath({
        teamSlug: teamMemberships[0].team.slug,
        path: "/[teamSlug]/dashboard",
      }),
    );
  } catch (e) {
    console.error(e);

    if (isRedirectError(e)) throw e;

    redirect("/");
  }
}
