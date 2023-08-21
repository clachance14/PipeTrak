"use client";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from "@components";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "OWNER"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function InviteMemberForm() {
  const t = useTranslations("settings.team.members");
  const { toast } = useToast();
  const router = useRouter();

  const roleOptions = [
    {
      label: t("roles.member"),
      value: "MEMBER",
    },
    {
      label: t("roles.owner"),
      value: "OWNER",
    },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onSubmit = () => {};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inviteMember.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inviteMember.role")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button className="w-full" type="submit">
            {t("inviteMember.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
