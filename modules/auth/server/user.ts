import { getAuthOptions } from '@auth/server/nextauth';
import { getServerSession } from 'next-auth';

export async function getUser() {
  return (await getServerSession(getAuthOptions()))?.user ?? null;
}
