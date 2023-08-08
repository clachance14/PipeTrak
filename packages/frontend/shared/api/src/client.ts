import type { AppRouter } from "@supastarter/backend/api";
import { createTRPCReact } from "@trpc/react-query";

export const apiClient = createTRPCReact<AppRouter>({});
