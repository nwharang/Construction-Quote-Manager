import { createTRPCRouter } from "~/server/api/trpc";
import { customerRouter } from "~/server/api/routers/customer";
import { quoteRouter } from "~/server/api/routers/quote";
import { productRouter } from "~/server/api/routers/product";
import { taskRouter } from "~/server/api/routers/task";
import { materialRouter } from "~/server/api/routers/material";
import { transactionRouter } from "~/server/api/routers/transaction";
import { settingsRouter } from "~/server/api/routers/settings";
import { dashboardRouter } from "~/server/api/routers/dashboard";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  customer: customerRouter,
  quote: quoteRouter,
  product: productRouter,
  task: taskRouter,
  material: materialRouter,
  transaction: transactionRouter,
  settings: settingsRouter,
  dashboard: dashboardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
