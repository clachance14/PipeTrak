import { AbilityBuilder, PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects, createPrismaAbility } from "@casl/prisma";
import { Team, TeamInvitation, TeamMembership, UserRole, db } from "database";

type AppAbility = PureAbility<
  [
    string,
    Subjects<{
      Team: Team;
      TeamInvitation: TeamInvitation;
      TeamMembership: TeamMembership;
    }>,
  ],
  PrismaQuery
>;

export async function defineAbilitiesFor({
  userId,
  teamId,
}: {
  userId: string;
  teamId?: string;
}) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createPrismaAbility,
  );

  const user = await db.userProfile.findFirst({
    where: {
      userId,
    },
  });

  if (!user) {
    return build();
  }

  const role: UserRole = user.role ?? "USER";

  /*
    Team permissions
  */

  // everyone can create a new team
  can("create", "Team");

  if (!teamId) {
    return build();
  }

  const teamMembership = await db.teamMembership.findFirst({
    where: {
      teamId,
      userId,
    },
  });

  if (!teamMembership) {
    return build();
  }

  const { role: teamRole } = teamMembership;

  can("read", "Team");
  can("read", "TeamInvitation");
  can("read", "TeamMembership");

  if (teamRole === "OWNER") {
    can("manage", "Team");
    can("manage", "TeamInvitation");
  }

  return build();
}
