import * as z from "zod"
import { CompleteTeamMembership, RelatedTeamMembershipModel, CompleteSubscription, RelatedSubscriptionModel, CompleteTeamInvitation, RelatedTeamInvitationModel } from "./index"

export const TeamModel = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteTeam extends z.infer<typeof TeamModel> {
  memberships: CompleteTeamMembership[]
  Subscription?: CompleteSubscription | null
  TeamInvitation: CompleteTeamInvitation[]
}

/**
 * RelatedTeamModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTeamModel: z.ZodSchema<CompleteTeam> = z.lazy(() => TeamModel.extend({
  memberships: RelatedTeamMembershipModel.array(),
  Subscription: RelatedSubscriptionModel.nullish(),
  TeamInvitation: RelatedTeamInvitationModel.array(),
}))
