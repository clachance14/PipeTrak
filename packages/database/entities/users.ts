import { prisma } from "../prisma/client";

export type { User } from "@prisma/client";

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

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const user = await prisma.user.create({
    data,
  });

  return user;
};

export const updateUser = async (data: {
  id: string;
  email?: string;
  password?: string;
  name?: string;
}) => {
  const user = await prisma.user.update({
    where: { id: data.id },
    data: data,
  });

  return user;
};

export const updateUserEmail = async (userId: string, email: string) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerified: null },
  });

  return user;
};
