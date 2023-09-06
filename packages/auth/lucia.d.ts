/// <reference types="lucia" />
declare namespace Lucia {
  type UserRole = import("database").UserRole;
  type Auth = import("./lib/lucia").Auth;
  type DatabaseUserAttributes = {
    email: string;
    email_verified: boolean;
    name: string | null;
    role: UserRole;
    avatar_url?: string | null;
    github_username?: string | null;
  };
  type DatabaseSessionAttributes = {};
}
