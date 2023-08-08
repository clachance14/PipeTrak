import {
  getUserOrganizationMemberships,
  getUserRole,
} from "@supastarter/backend/database";
import { protectedProcedure } from "src/trpc";

export const authRouter = {
  userInformation: protectedProcedure.query(async ({ ctx: { session } }) => {
    const { user } = session!;

    const role = getUserRole(user.id);
    const organizations = getUserOrganizationMemberships(user.id);

    return {
      ...user,
      role,
      organizations,
    };
  }),
};
