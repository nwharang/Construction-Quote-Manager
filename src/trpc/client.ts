import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@/server/api/root";
import { getUrl } from "./shared";
import { httpBatchLink } from "@trpc/react-query";

export const api = createTRPCReact<AppRouter>();

export const getClientConfig = () => ({
  links: [
    httpBatchLink({
      url: getUrl(),
    }),
  ],
});
