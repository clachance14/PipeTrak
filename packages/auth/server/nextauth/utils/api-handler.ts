import NextAuth from "next-auth";
import { getAuthOptions } from "./auth-options";

export const apiHandler = NextAuth(getAuthOptions());
