"use client";

import { inviteTeamMemberDialogOpen } from "@saas/settings/state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { InviteMemberForm } from "./InviteMemberForm";

export function InviteMemberDialog() {
  const t = useTranslations("settings.team.members.inviteMember");
  const [open, setOpen] = useAtom(inviteTeamMemberDialogOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <InviteMemberForm />
      </DialogContent>
    </Dialog>
  );
}
