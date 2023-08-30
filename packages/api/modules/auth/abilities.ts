import { TeamMembership } from "database";
import { User } from "./types";

export function defineAbilitiesFor({
  user,
  teamMemberships,
}: {
  user: User | null;
  teamMemberships: TeamMembership[] | null;
}) {
  const isAdmin = user?.role === "ADMIN";

  const getTeamRole = (teamId: string) =>
    teamMemberships?.find((m) => m.teamId === teamId)?.role ?? null;

  const isTeamMember = (teamId: string) => !!getTeamRole(teamId);

  const isTeamOwner = (teamId: string) => getTeamRole(teamId) === "OWNER";

  return {
    isAdmin,
    isTeamMember,
    isTeamOwner,
  };
}
