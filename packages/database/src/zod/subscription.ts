import * as z from "zod"
import { CompleteTeam, RelatedTeamModel } from "./index"

export const SubscriptionModel = z.object({
  id: z.string(),
  teamId: z.string(),
  customerId: z.string(),
  subscriptionId: z.string(),
  status: z.string(),
  planId: z.string(),
  variantId: z.string(),
  nextPaymentDate: z.date().nullish(),
})

export interface CompleteSubscription extends z.infer<typeof SubscriptionModel> {
  team: CompleteTeam
}

/**
 * RelatedSubscriptionModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSubscriptionModel: z.ZodSchema<CompleteSubscription> = z.lazy(() => SubscriptionModel.extend({
  team: RelatedTeamModel,
}))
