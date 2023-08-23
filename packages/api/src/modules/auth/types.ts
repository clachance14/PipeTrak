import { UserRole } from "database";

export type User = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
};
