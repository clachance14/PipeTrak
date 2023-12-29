import { TEAM_SLUG_COOKIE_NAME } from "@saas/shared/constants";
import Cookies from "js-cookie";

export function updateTeamSlugCookie(teamSlug: string) {
  Cookies.set(TEAM_SLUG_COOKIE_NAME, teamSlug, { path: "/", expires: 30 });
}
