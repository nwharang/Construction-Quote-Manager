import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';
import { CustomerService } from '@/server/services/customer';

const customerService = new CustomerService();

export const customersRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    return customerService.getAll();
  }),
}); 