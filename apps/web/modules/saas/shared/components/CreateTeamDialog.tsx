"use client";

import { updateTeamSlugCookie } from "@saas/auth/lib/team-slug";
import { createTeamDialogOpen } from "@saas/dashboard/state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { CreateTeamForm } from "./CreateTeamForm";

export function CreateTeamDialog() {
  const t = useTranslations();
  const [open, setOpen] = useAtom(createTeamDialogOpen);
  const router = useRouter();
  const pathname = usePathname();

  const switchTeam = (slug: string) => {
    updateTeamSlugCookie(slug);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTeam.title")}</DialogTitle>
        </DialogHeader>

        <CreateTeamForm
          onSuccess={async (team) => {
            switchTeam(team.slug);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
