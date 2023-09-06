import { createApiCaller } from "api";
import { Team } from "database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const apiCaller = await createApiCaller();

  try {
    const user = await apiCaller.auth.user();

    if (!user)
      return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));

    const { teamMemberships } = user;

    // if user has no teams, we create one for them
    if (!teamMemberships || !teamMemberships.length) {
      let team: Team | undefined = undefined;
      let iteration = 0;

      do {
        if (iteration === 10) return NextResponse.redirect(requestUrl.origin);

        try {
          const name = user.name || user.email.split("@")[0];
          const slug = `${name}${iteration ? ` ${iteration + 1}` : ""}`;

          team = await apiCaller.team.create({
            name: name,
            slug,
          });
        } catch (e) {
          console.error(e);
        }

        iteration++;
      } while (!team);

      return NextResponse.redirect(
        new URL(`/${team.slug}/dashboard`, requestUrl.origin),
      );
    }

    // check cookie for latest team
    const teamSlugCookie = cookies().get("team-slug")?.value;

    if (teamSlugCookie) {
      const teamMembership = teamMemberships.find(
        (membership) => membership.team.slug === teamSlugCookie,
      );

      if (teamMembership) {
        return NextResponse.redirect(
          new URL(`/${teamMembership.team.slug}/dashboard`, requestUrl.origin),
        );
      }
    }

    return NextResponse.redirect(
      new URL(`/${teamMemberships[0].team.slug}/dashboard`, requestUrl.origin),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(requestUrl.origin);
  }
}
