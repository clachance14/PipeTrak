const translations = {
  backToSignin: "Back to signin",
  hints: {
    passwordNotUpdated: {
      message:
        "We are sorry, but we were unable to update your password. Please try again later.",
      title: "Password not updated",
    },
  },
  message: "Enter your new password to update your account.",
  newPassword: "New password",
  submit: "Update password",
  title: "Reset your password",
};

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">{translations.title}</h1>
      <p className="mb-6 mt-4 text-zinc-500">
        {translations.message}{" "}
        <Link href="/signup">{translations.backToSignin} &rarr;</Link>
      </p>
      <ResetPasswordForm
        labels={{
          newPassword: translations.newPassword,
          submit: translations.submit,
          hints: {
            passwordNotUpdated: {
              title: translations.hints.passwordNotUpdated.title,
              message: translations.hints.passwordNotUpdated.message,
            },
          },
        }}
      />
    </>
  );
}
