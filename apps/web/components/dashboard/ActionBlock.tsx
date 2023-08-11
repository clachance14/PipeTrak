import { Button } from "@components";

export function ActionBlock({
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
      className="bg-card text-card-foreground overflow-hidden rounded-xl border"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="mb-3 text-2xl font-semibold">{title}</h2>
      {children}
      <div className="-mx-6 -mb-6 mt-6 flex justify-end border-t px-6 py-3">
        <Button type="submit" disabled={isSubmitDisabled}>
          Save
        </Button>
      </div>
    </form>
  );
}
