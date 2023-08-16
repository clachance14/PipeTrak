import { Team, createApiCaller } from "api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.nextUrl);
  const apiCaller = await createApiCaller();

  try {
    const user = await apiCaller.user.info();

    if (!user) throw new Error("Unauthorized");

    const teams = await apiCaller.user.teams();

    // if user has no teams, we create one for them
    if (!teams || !teams.length) {
      let team: Team;
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

    return NextResponse.redirect(
      `${requestUrl.origin}/${teams[0].slug}/dashboard`,
    );
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(requestUrl.origin);
  }
}
