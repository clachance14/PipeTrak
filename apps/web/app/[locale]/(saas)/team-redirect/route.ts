import { ApiOutput, createApiCaller } from "api";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.nextUrl);
  const apiCaller = await createApiCaller();

  try {
    const user = await apiCaller.user.me();

    if (!user) throw new Error("Unauthorized");

    const teams = await apiCaller.user.teams({ userId: user.id });

    // if user has no teams, we create one for them
    if (!teams || !teams.length) {
      let team: ApiOutput["user"]["teams"][number] | undefined = undefined;
      let iteration = 0;

      do {
        try {
          team = await apiCaller.team.create({
            name: `${user.name}'s Team`,
            slug: `${user.name.replace(" ", "-").toLowerCase()}${
              iteration ? `-${iteration}` : ""
            }`,
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
      const team = teams.find((team) => team.slug === teamSlugCookie);

      if (team) {
        return NextResponse.redirect(
          `${requestUrl.origin}/${team.slug}/dashboard`,
        );
      }
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/${teams[0].slug}/dashboard`,
    );
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(requestUrl.origin);
  }
}
