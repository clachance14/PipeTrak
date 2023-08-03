import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    LEMONSQUEEZY_SIGNING_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_MARKETING_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
    LEMONSQUEEZY_SIGNING_SECRET: process.env.LEMONSQUEEZY_SIGNING_SECRET,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
