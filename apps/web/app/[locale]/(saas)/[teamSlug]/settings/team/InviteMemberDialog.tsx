"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components";
import { inviteTeamMemberDialogOpen } from "@lib/state/settings";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import InviteMemberForm from "./InviteMemberForm";

export default function InviteMemberDialog() {
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
