import { createApiCaller } from "api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const redirectTo = requestUrl.searchParams.get("redirectTo");

  const apiCaller = await createApiCaller();

  try {
    const claims = await apiCaller.user.claims();

    if (!claims) throw new Error("No claims for user");

    console.log(claims);

    const { teams, user } = claims;

    // if user has no teams, we create one for them
    if (!teams || !teams.length) {
      const team = await apiCaller.team.create({
        name: `${user.name}'s Team`,
        slug: user.name.replace(" ", "-").toLowerCase(),
      });

      return NextResponse.redirect(
        `${requestUrl.origin}/${team.slug}/dashboard`,
      );
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/${teams[0].team.slug}/dashboard`,
    );
  } catch (e) {
    return NextResponse.redirect(requestUrl.origin);
  }
}
