import { OrganizationMembership, RoleType } from "@prisma/client";
import { prisma } from "../prisma/client";

export async function getUserRole(userId: string) {
  const data = await prisma.userRole.findFirst({
    where: {
      userId,
    },
  });

  return data?.role || RoleType.USER;
}

export async function getUserOrganizationMemberships(
  userId: string,
): Promise<OrganizationMembership[]> {
  const data = await prisma.organizationMembership.findMany({
    where: {
      userId: {
        contains: userId,
      },
    },
    include: {
      organization: true,
    },
  });

  return data;
}
