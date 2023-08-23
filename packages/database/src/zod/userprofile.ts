import * as z from "zod"
import { UserRole } from "@prisma/client"

export const UserProfileModel = z.object({
  userId: z.string(),
  avatarUrl: z.string().nullish(),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date(),
})
