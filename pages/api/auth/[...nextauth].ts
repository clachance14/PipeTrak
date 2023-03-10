import { SessionAction } from '@auth/types';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import { getAuthOptions } from '../../../nextauth.config';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
