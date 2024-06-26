"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@i18n";
import { apiClient } from "@shared/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "../hooks/use-user";
import SigninModeSwitch from "./SigninModeSwitch";
import { SocialSigninButton, oAuthProviders } from "./SocialSigninButton";
import { TeamInvitationInfo } from "./TeamInvitationInfo";

const formSchema = z.object({
	email: z.string().email(),
	password: z.optional(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
	const t = useTranslations();
	const router = useRouter();
	const { user, loaded } = useUser();
	const [signinMode, setSigninMode] = useState<"password" | "magic-link">(
		"magic-link",
	);
	const [serverError, setServerError] = useState<null | {
		title: string;
		message: string;
	}>(null);
	const [showPassword, setShowPassword] = useState(false);
	const searchParams = useSearchParams();

	const loginWithPasswordMutation =
		apiClient.auth.loginWithPassword.useMutation();
	const loginWithEmailMutation = apiClient.auth.loginWithEmail.useMutation();

	const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

	const invitationCode = searchParams.get("invitationCode");
	const redirectTo = invitationCode
		? `/team/invitation?code=${invitationCode}`
		: searchParams.get("redirectTo") ?? "/app";
	const email = searchParams.get("email");

	useEffect(() => {
		if (email) {
			form.setValue("email", email);
		}
	}, [email]);

	useEffect(() => {
		form.reset();
		setServerError(null);
	}, [signinMode]);

	const handleRedirect = () => {
		router.replace(redirectTo);
	};

	// redirect when user has been loaded
	useEffect(() => {
		if (user && loaded) {
			handleRedirect();
		}
	}, [user, loaded]);

	const onSubmit: SubmitHandler<FormValues> = async ({ email, password }) => {
		setServerError(null);
		try {
			if (signinMode === "password") {
				await loginWithPasswordMutation.mutateAsync({
					email,
					password: password as string,
				});

				handleRedirect();
			} else {
				await loginWithEmailMutation.mutateAsync({
					email,
					callbackUrl: new URL(
						"/auth/verify",
						window.location.origin,
					).toString(),
				});

				const redirectSearchParams = new URLSearchParams();
				redirectSearchParams.set("type", "LOGIN");
				redirectSearchParams.set("redirectTo", redirectTo);
				if (invitationCode) {
					redirectSearchParams.set("invitationCode", invitationCode);
				}
				if (email) {
					redirectSearchParams.set("identifier", email);
				}
				router.replace(`/auth/otp?${redirectSearchParams.toString()}`);
			}
		} catch (e) {
			setServerError({
				title: t("auth.login.hints.invalidCredentials.title"),
				message: t("auth.login.hints.invalidCredentials.message"),
			});
		}
	};

	return (
		<div>
			<h1 className="text-3xl font-extrabold md:text-4xl">
				{t("auth.login.title")}
			</h1>
			<p className="mb-6 mt-4 text-muted-foreground">
				{t("auth.login.subtitle")}
			</p>

			{invitationCode && <TeamInvitationInfo className="mb-6" />}

			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
				{Object.keys(oAuthProviders).map((providerId) => (
					<SocialSigninButton key={providerId} provider={providerId} />
				))}
			</div>

			<hr className=" my-8" />

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<SigninModeSwitch
						className="w-full"
						activeMode={signinMode}
						onChange={(value) => setSigninMode(value as typeof signinMode)}
					/>
					{form.formState.isSubmitted && serverError && (
						<Alert variant="error">
							<AlertTriangleIcon className="size-4" />
							<AlertTitle>{serverError.title}</AlertTitle>
							<AlertDescription>{serverError.message}</AlertDescription>
						</Alert>
					)}

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.signup.email")}</FormLabel>
								<FormControl>
									<Input {...field} autoComplete="email" />
								</FormControl>
							</FormItem>
						)}
					/>

					{signinMode === "password" && (
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("auth.signup.password")}</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												type={showPassword ? "text" : "password"}
												className="pr-10"
												{...field}
												autoComplete="current-password"
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute inset-y-0 right-0 flex items-center pr-4 text-xl text-primary"
											>
												{showPassword ? (
													<EyeOffIcon className="size-4" />
												) : (
													<EyeIcon className="size-4" />
												)}
											</button>
										</div>
									</FormControl>
									<FormDescription className="text-right">
										<Link href="/auth/forgot-password">
											{t("auth.login.forgotPassword")}
										</Link>
									</FormDescription>
								</FormItem>
							)}
						/>
					)}

					<Button
						className="w-full"
						type="submit"
						loading={form.formState.isSubmitting}
					>
						{signinMode === "password"
							? t("auth.login.submit")
							: t("auth.login.sendMagicLink")}
					</Button>

					<div>
						<span className="text-muted-foreground">
							{t("auth.login.dontHaveAnAccount")}{" "}
						</span>
						<Link
							href={`/auth/signup${
								invitationCode
									? `?invitationCode=${invitationCode}&email=${email}`
									: ""
							}`}
						>
							{t("auth.login.createAnAccount")}
							<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
						</Link>
					</div>
				</form>
			</Form>
		</div>
	);
}
