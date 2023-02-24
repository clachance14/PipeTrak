import { getAuthOptions } from '@auth/server';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(getAuthOptions(req))(req, res);
}
