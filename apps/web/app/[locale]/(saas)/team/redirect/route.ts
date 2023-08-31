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
    const user = await apiCaller.user.me();

    if (!user) throw new Error("Unauthorized");

    const teamMemberships = await apiCaller.user.teamMemberships({
      userId: user.id,
    });

    // if user has no teams, we create one for them
    if (!teamMemberships || !teamMemberships.length) {
      let team: Team | undefined = undefined;
      let iteration = 0;

      do {
        try {
          const name = user.name || user.email.split("@")[0];
          team = await apiCaller.team.create({
            name: name,
            slug: `${name}${iteration ? ` ${iteration}` : ""}`,
          });
        } catch {}
      } while (!team);

      return NextResponse.redirect(
        `${requestUrl.origin}/${team.slug}/dashboard`,
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
          `${requestUrl.origin}/${teamMembership.team.slug}/dashboard`,
        );
      }
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/${teamMemberships[0].team.slug}/dashboard`,
    );
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(requestUrl.origin);
  }
}
