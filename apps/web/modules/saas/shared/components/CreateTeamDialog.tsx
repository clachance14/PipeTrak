"use client";

import { updateTeamSlugCookie } from "@saas/auth/lib/team-slug";
import { createTeamDialogOpen } from "@saas/dashboard/state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useRouter } from "next/navigation";
import { CreateTeamForm } from "./CreateTeamForm";

export function CreateTeamDialog() {
  const t = useTranslations();
  const [open, setOpen] = useAtom(createTeamDialogOpen);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const { teamSlug } = params;

  const switchTeam = (slug: string) => {
    updateTeamSlugCookie(slug);
    router.replace(pathname.replace(teamSlug as string, slug));
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
