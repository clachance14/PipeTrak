import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './router';

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCReact<AppRouter>({});
