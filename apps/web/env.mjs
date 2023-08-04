import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    LEMONSQUEEZY_SIGNING_SECRET: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    LEMONSQUEEZY_SIGNING_SECRET: process.env.LEMONSQUEEZY_SIGNING_SECRET,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
