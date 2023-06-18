import { getServerSession } from "next-auth";
import { apiHandler } from "./utils/api-handler";
import { getAuthOptions } from "./utils/auth-options";

export const getUser = async () => {
  return (await getServerSession(getAuthOptions()))?.user ?? null;
};

export { apiHandler, getAuthOptions };
