import { TRPCError } from "@trpc/server";
import { TeamInvitationModel, db } from "database";
import { z } from "zod";
import { defineAbilitiesFor } from "../../auth";
import { protectedProcedure } from "../../trpc";

export const invitations = protectedProcedure
  .input(
    z.object({
      teamId: z.string(),
    }),
  )
  .output(z.array(TeamInvitationModel))
  .query(async ({ input: { teamId }, ctx: { user } }) => {
    const abilities = await defineAbilitiesFor({
      userId: user!.id,
      teamId,
    });

    if (!abilities.can("read", "TeamInvitation")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No permission to read the invitations for this team.",
      });
    }

    const invitations = await db.teamInvitation.findMany({
      where: {
        teamId,
      },
    });

    return invitations;
  });
