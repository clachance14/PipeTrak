"use client";

import { trpc } from "api/client";
import { Button } from "ui";

export default function TestComponent({ userName }: { userName: string }) {
  const { mutateAsync, isLoading } = trpc.changeName.useMutation();

  const changeName = async () => {
    try {
      await mutateAsync({ name: userName });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      {isLoading && <div>Changing name...</div>}
      <Button onClick={() => changeName()}>Change user name</Button>
    </div>
  );
}
