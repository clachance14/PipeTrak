import { createContext } from "./context";
import { apiRouter } from "./router";

let caller: ReturnType<typeof apiRouter.createCaller> | null = null;

export const createApiCaller = async () => {
  // if (caller)
  //   return caller;

  const context = await createContext();
  caller = apiRouter.createCaller(context);
  return caller;
};
