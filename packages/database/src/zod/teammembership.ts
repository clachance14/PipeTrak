import * as z from "zod"
import { TeamMemberRole } from "@prisma/client"
import { CompleteTeam, RelatedTeamModel } from "./index"

export const TeamMembershipModel = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  role: z.nativeEnum(TeamMemberRole),
  isCreator: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteTeamMembership extends z.infer<typeof TeamMembershipModel> {
  team: CompleteTeam
}

/**
 * RelatedTeamMembershipModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTeamMembershipModel: z.ZodSchema<CompleteTeamMembership> = z.lazy(() => TeamMembershipModel.extend({
  team: RelatedTeamModel,
}))
