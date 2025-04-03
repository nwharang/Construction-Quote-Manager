import { createTRPCRouter } from '@/trpc/trpc';
import { customersRouter } from './routers/customers';

export const appRouter = createTRPCRouter({
  customers: customersRouter,
});

export type AppRouter = typeof appRouter; 