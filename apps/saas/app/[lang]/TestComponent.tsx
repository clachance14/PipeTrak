"use client";

import { trpc } from "api/client";
import { useAuthActions } from "auth-client";
import { Button } from "ui";

export default function TestComponent({ userName }: { userName: string }) {
  const { mutateAsync, isLoading } = trpc.changeName.useMutation();
  const { signOut } = useAuthActions();

  const changeName = async () => {
    try {
      await mutateAsync({ name: userName });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <Button onClick={() => signOut()}>Sign out</Button>
    </div>
  );
}
