"use client";

import { apiClient } from "@shared/lib/api-client";
import { Button } from "@ui/components/button";
import { Icon } from "@ui/components/icon";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "../hooks/use-user";

export function VerifyTokenView() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [tokenVerified, setTokenVerified] = useState(false);
  const searchParams = useSearchParams();
  const { reloadUser } = useUser();

  const token = searchParams.get("token") ?? "";

  const verifyTokenMutation = apiClient.auth.verifyToken.useMutation();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      try {
        await verifyTokenMutation.mutateAsync({ token });
        setTokenVerified(true);
        await reloadUser();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // TODO: Add texts for invalid token

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {tokenVerified
          ? t("auth.confirmation.title")
          : t("auth.invalidToken.title")}
      </h1>
      <p className="text-muted-foreground mb-4 mt-2">
        {tokenVerified
          ? t("auth.confirmation.message")
          : t("auth.invalidToken.message")}
      </p>
      <Button className="w-full" onClick={() => window.close()}>
        {t("auth.confirmation.close")}
      </Button>
    </div>
  );
}
