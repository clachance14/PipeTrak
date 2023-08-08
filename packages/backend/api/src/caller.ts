import { appRouter } from "./router";

export const apiCaller = appRouter.createCaller({ session: null });
