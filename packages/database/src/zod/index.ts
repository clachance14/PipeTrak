import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','email','email_verified','role','name','avatar_url','github_username']);

export const UserSessionScalarFieldEnumSchema = z.enum(['id','user_id','active_expires','idle_expires']);

export const UserKeyScalarFieldEnumSchema = z.enum(['id','hashed_password','user_id']);

export const UserVerificationTokenScalarFieldEnumSchema = z.enum(['id','user_id','token','expires']);

export const UserOneTimePasswordScalarFieldEnumSchema = z.enum(['id','user_id','code','type','identifier','expires']);

export const TeamScalarFieldEnumSchema = z.enum(['id','name','slug']);

export const TeamMembershipScalarFieldEnumSchema = z.enum(['id','team_id','user_id','role','is_creator']);

export const TeamInvitationScalarFieldEnumSchema = z.enum(['id','team_id','email','role','createdAt','expiresAt']);

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','team_id','customer_id','status','plan_id','variant_id','next_payment_date']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const UserRoleSchema = z.enum(['USER','ADMIN']);

export type UserRoleType = `${z.infer<typeof UserRoleSchema>}`

export const UserOneTimePasswordTypeSchema = z.enum(['SIGNUP','LOGIN','PASSWORD_RESET']);

export type UserOneTimePasswordTypeType = `${z.infer<typeof UserOneTimePasswordTypeSchema>}`

export const TeamMemberRoleSchema = z.enum(['MEMBER','OWNER']);

export type TeamMemberRoleType = `${z.infer<typeof TeamMemberRoleSchema>}`

export const SubscriptionStatusSchema = z.enum(['TRIALING','ACTIVE','PAUSED','CANCELED','PAST_DUE','UNPAID','INCOMPLETE','EXPIRED']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: UserRoleSchema,
  id: z.string(),
  email: z.string(),
  email_verified: z.boolean(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  github_username: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER SESSION SCHEMA
/////////////////////////////////////////

export const UserSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  active_expires: z.bigint(),
  idle_expires: z.bigint(),
})

export type UserSession = z.infer<typeof UserSessionSchema>

/////////////////////////////////////////
// USER KEY SCHEMA
/////////////////////////////////////////

export const UserKeySchema = z.object({
  id: z.string(),
  hashed_password: z.string().nullable(),
  user_id: z.string(),
})

export type UserKey = z.infer<typeof UserKeySchema>

/////////////////////////////////////////
// USER VERIFICATION TOKEN SCHEMA
/////////////////////////////////////////

export const UserVerificationTokenSchema = z.object({
  id: z.string().cuid(),
  user_id: z.string(),
  token: z.string(),
  expires: z.coerce.date(),
})

export type UserVerificationToken = z.infer<typeof UserVerificationTokenSchema>

/////////////////////////////////////////
// USER ONE TIME PASSWORD SCHEMA
/////////////////////////////////////////

export const UserOneTimePasswordSchema = z.object({
  type: UserOneTimePasswordTypeSchema,
  id: z.string().cuid(),
  user_id: z.string(),
  code: z.string(),
  identifier: z.string(),
  expires: z.coerce.date(),
})

export type UserOneTimePassword = z.infer<typeof UserOneTimePasswordSchema>

/////////////////////////////////////////
// TEAM SCHEMA
/////////////////////////////////////////

export const TeamSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  slug: z.string(),
})

export type Team = z.infer<typeof TeamSchema>

/////////////////////////////////////////
// TEAM MEMBERSHIP SCHEMA
/////////////////////////////////////////

export const TeamMembershipSchema = z.object({
  role: TeamMemberRoleSchema,
  id: z.string().cuid(),
  team_id: z.string(),
  user_id: z.string(),
  is_creator: z.boolean(),
})

export type TeamMembership = z.infer<typeof TeamMembershipSchema>

/////////////////////////////////////////
// TEAM INVITATION SCHEMA
/////////////////////////////////////////

export const TeamInvitationSchema = z.object({
  role: TeamMemberRoleSchema,
  id: z.string().cuid(),
  team_id: z.string(),
  email: z.string(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
})

export type TeamInvitation = z.infer<typeof TeamInvitationSchema>

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  id: z.string(),
  team_id: z.string(),
  customer_id: z.string(),
  plan_id: z.string(),
  variant_id: z.string(),
  next_payment_date: z.coerce.date().nullable(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
