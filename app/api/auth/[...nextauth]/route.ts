import NextAuth from 'next-auth';

import { getAuthOptions } from '@auth/providers/nextauth';
import { SessionAction } from '@auth/types';

function handler(req: Request, res: Response) {
  let action: SessionAction | undefined = undefined,
    workspaceId;

  if (req.url?.includes('/session?workspaceId=')) {
    action = 'switchWorkspace';
    workspaceId = req.url?.split('?workspaceId=')[1];
  } else if (req.url?.includes('/session?update')) {
    action = 'updateSession';
  }

  return NextAuth(getAuthOptions({ action, workspaceId }))(req, res);
}

export { handler as GET, handler as POST };
