"use client";

import { trpc } from "api/client";
import { useAuthActions } from "auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "ui";
import ActionBlock from "../../../../../components/ActionBlock";

export default function ChangeEmailForm({
  initialValue,
}: {
  initialValue: string;
}) {
  const { signOut } = useAuthActions();
  const [email, setEmail] = useState(initialValue);
  const router = useRouter();

  const changeEmailMutation = trpc.changeEmail.useMutation({
    onSuccess: async () => {
      // await signIn("change-email", {
      //   email,
      //   redirect: false,
      //   callbackUrl: window.location.href,
      // });
      await signOut();
    },
  });

  return (
    <ActionBlock
      title="Change email"
      onSubmit={() => changeEmailMutation.mutate({ email })}
      isSubmitting={changeEmailMutation.isLoading}
      isSubmitDisabled={email === initialValue || !email}
    >
      <Input
        type="email"
        className="max-w-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </ActionBlock>
  );
}
