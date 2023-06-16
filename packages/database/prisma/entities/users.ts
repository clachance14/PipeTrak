import { prisma } from "../util/client";

export { User } from "@prisma/client";

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user;
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });
  return user;
};
