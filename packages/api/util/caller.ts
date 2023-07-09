import { getUserSession } from "auth";
import { appRouter } from "router";

export const getTrpcCaller = async () => {
  const session = await getUserSession();

  return appRouter.createCaller({
    session,
  });
};
