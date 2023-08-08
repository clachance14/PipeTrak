import { Button } from "@/components";

export default function ActionBlock({
  children,
  title,
  onSubmit,
  isSubmitting,
  isSubmitDisabled,
}: {
  onSubmit: () => void;
  title: string;
  children: React.ReactNode;
  isSubmitting: boolean;
  isSubmitDisabled?: boolean;
}) {
  return (
    <form
      className="overflow-hidden rounded-xl border bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="mb-3 text-2xl font-semibold">{title}</h2>
      {children}
      <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t  px-6 py-3 dark:border-zinc-800 ">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitDisabled}
        >
          Save
        </Button>
      </div>
    </form>
  );
}
