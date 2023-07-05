import { getServerSession } from "next-auth";
import { UserSession } from "../../../types";
import { getAuthOptions } from "./auth-options";

export const getUserSession = async (): Promise<UserSession | null> => {
  return await getServerSession(getAuthOptions());
};
