import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./modules/trpc";

export { defineAbilitiesFor, type User } from "./modules/auth";
export { createApiCaller } from "./modules/trpc";

export type ApiInput = inferRouterInputs<AppRouter>;
export type ApiOutput = inferRouterOutputs<AppRouter>;
