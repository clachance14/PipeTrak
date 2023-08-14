"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamDialogOpen } from "@lib/state/dashboard";
import { apiClient } from "api/client";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  useToast,
} from "../base";

const formSchema = z.object({
  name: z.string().min(3).max(32),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTeamDialog() {
  const t = useTranslations("dashboard.createTeam");
  const [open, setOpen] = useAtom(createTeamDialogOpen);
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const createTeamMutation = apiClient.team.create.useMutation();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const newTeam = await createTeamMutation.mutateAsync(data);

      // redirect to team settings page
      router.push(`/${newTeam.slug}/settings/team`);
      toast({
        title: t("notifications.success"),
      });
      setOpen(false);
    } catch (e) {
      toast({
        title: t("notifications.error"),
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <label className="mb-2 block text-sm font-medium">
              {t("name")}
            </label>
            <Input type="text" {...register("name", { required: true })} />
          </div>

          <DialogFooter>
            <Button type="submit" loading={isSubmitting}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
