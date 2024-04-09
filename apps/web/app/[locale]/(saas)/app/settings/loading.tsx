import { LoaderIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-8">
      <LoaderIcon className="text-primary size-4 animate-spin text-3xl" />
    </div>
  );
}
