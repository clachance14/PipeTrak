import { createContext } from "./context";
import { appRouter } from "./router";

let caller: ReturnType<typeof appRouter.createCaller> | null = null;

export const createApiCaller = async () => {
  if (caller) {
    return caller;
  }

  const context = await createContext();
  caller = appRouter.createCaller(context);
  return caller;
};
