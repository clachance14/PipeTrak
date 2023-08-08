export type User = {
  id: string;
  email: string;
  name: string;
};

export type UserSession = {
  user: User;
};

export type AuthProviderServerModule = {
  getUser: () => Promise<User | null>;
};
