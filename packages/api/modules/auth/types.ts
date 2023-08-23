import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  avatarUrl: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
