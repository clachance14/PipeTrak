import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_SAAS_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SAAS_URL: process.env.NEXT_PUBLIC_SAAS_URL,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
