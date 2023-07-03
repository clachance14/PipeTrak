import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MAIL_HOST: z.string().min(1),
    MAIL_PORT: z
      .string()
      .min(1)
      .transform((s) => parseInt(s, 10))
      .pipe(z.number()),
    MAIL_USER: z.string().min(1),
    MAIL_PASS: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
