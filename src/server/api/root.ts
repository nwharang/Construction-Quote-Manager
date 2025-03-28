import { createTRPCRouter } from "~/server/api/trpc";
import { quoteRouter } from "~/server/api/routers/quote";
import { taskRouter } from "~/server/api/routers/task";
import { materialRouter } from "~/server/api/routers/material";
import { authRouter } from "~/server/api/routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  quote: quoteRouter,
  task: taskRouter,
  material: materialRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
