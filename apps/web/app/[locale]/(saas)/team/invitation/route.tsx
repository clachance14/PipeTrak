import { createApiCaller } from "api";
import { redirect } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  try {
    if (!code) throw new Error("No invitation code query param provided");

    const apiCaller = await createApiCaller();

    const invitation = await apiCaller.team.invitationById({
      id: code,
    });

    if (!invitation) throw new Error("Invitation not found");

    const user = await apiCaller.auth.user();

    if (!user)
      return redirect(
        `/auth/login?invitationCode=${invitation.id}&email=${invitation.email}`,
      );

    const team = await apiCaller.team.acceptInvitation({
      id: code,
    });

    if (!team) throw new Error("Team not found");

    return redirect(`/${team.slug}/dashboard`);
  } catch (e) {
    console.error(e);
    return redirect("/");
  }
}
