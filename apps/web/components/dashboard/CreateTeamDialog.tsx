"use client";
import { createTeamDialogOpen } from "@lib/state/dashboard";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../base";
import { CreateTeamForm } from "./CreateTeamForm";

export function CreateTeamDialog() {
  const t = useTranslations("createTeam");
  const [open, setOpen] = useAtom(createTeamDialogOpen);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <CreateTeamForm
          isInitialTeam={false}
          onSuccess={(team) => {
            router.push(`/${team.slug}/settings/team`);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
