import {
  User,
  createUser as createUserDb,
  updateUser as updateUserDb,
  updateUserEmail as updateUserEmailDb,
} from "database";
import { hash } from "./hash";
import { getUserSession } from "./session";

export { getUserByEmail, getUserById } from "database";

export const updateUserEmail = async (email: string) => {
  const session = await getUserSession();
  if (!session) throw new Error("No session found.");

  await updateUserEmailDb(session.user.id, email);
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> => {
  const passwordHash = await hash(data.password);
  const user = await createUserDb({
    name: data.name,
    email: data.email,
    password: passwordHash,
  });

  return user;
};

export const updateUserName = async (name: string) => {
  const session = await getUserSession();
  if (!session) throw new Error("No session found.");

  await updateUserDb({
    id: session.user.id,
    name,
  });
};

export const updateUserPassword = async (password: string) => {
  const session = await getUserSession();
  if (!session) throw new Error("No session found.");

  const passwordHash = await hash(password);

  await updateUserDb({
    id: session.user.id,
    password: passwordHash,
  });
};
