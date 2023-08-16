"use client";

import { useUser } from "@lib/auth";
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
  const { switchTeam, reloadTeams } = useUser();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <CreateTeamForm
          isInitialTeam={false}
          onSuccess={async (team) => {
            await reloadTeams();
            switchTeam(team.id);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
