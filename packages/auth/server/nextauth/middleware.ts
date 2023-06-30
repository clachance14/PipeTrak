import { withAuth } from "next-auth/middleware";
import { NextMiddlewareResult } from "next/dist/server/web/types";
import { NextRequest, NextResponse } from "next/server";

export const authMiddleware = (
  onSuccess: (req: NextRequest) => NextResponse | void,
) => {
  return withAuth(onSuccess, {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }) as (req: NextRequest) => Promise<NextMiddlewareResult>;
};
