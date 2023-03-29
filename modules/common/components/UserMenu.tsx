'use client';

import * as menu from '@zag-js/menu';
import { normalizeProps, useMachine } from '@zag-js/react';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useId } from 'react';
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';

export default function UserMenu({ user }: { user: User }) {
  const [state, send] = useMachine(
    menu.machine({
      id: useId(),
      'aria-label': 'User menu',
      loop: true,
      positioning: {
        placement: 'top-end',
      },
    })
  );
  const api = menu.connect(state, send, normalizeProps);

  return (
    <>
      <button className="flex w-full items-center gap-2 border-none bg-transparent p-0" {...api.triggerProps}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 bg-opacity-10 text-2xl text-blue-500">
          <FiUser />
        </span>
        <span className="block flex-1 text-left leading-none">
          <strong className="block text-sm">{user.name}</strong>
          <span className="text-xs text-gray-500">{user.email}</span>
        </span>
        <FiChevronDown className="opacity-30" />
      </button>

      <div className="w-[80%] text-sm" {...api.positionerProps}>
        <ul
          className="rounded-lg border border-zinc-200 bg-white p-1 text-zinc-600 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          {...api.contentProps}
        >
          <li
            className="flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic text-zinc-700 data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:text-zinc-300 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white"
            {...api.getItemProps({
              id: 'logout',
            })}
            onClick={() =>
              signOut({
                callbackUrl: '/',
              })
            }
          >
            <FiLogOut /> Logout
          </li>
        </ul>
      </div>
    </>
  );
}
