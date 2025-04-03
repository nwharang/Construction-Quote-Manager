import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { customers } from '~/server/db/schema';
import { eq, and, sql, or, ilike, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { CustomerService } from '../../services/customerService';
import { AuthService } from '../../services/authService';
import { db } from '../../db';

const customerInput = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Define the input schema for the update procedure, including the id
const updateRouterInputSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const deleteInputSchema = z.object({ id: z.string().uuid('Invalid customer ID format') });

// Define input schema for getAll
const getAllInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

// Define input schema for getById
const getByIdInputSchema = z.object({ id: z.string().uuid('Invalid customer ID format') });

export const customerRouter = createTRPCRouter({
  getAll: protectedProcedure.input(getAllInputSchema).query(async ({ ctx, input }) => {
    try {
      // 1. Instantiate CustomerService
      const customerService = new CustomerService(db, ctx);

      // 2. Delegate fetching to the service
      // The service method (CustomerService.getAllCustomers) now handles pagination, search, and NO userId filtering.
      const result = await customerService.getAllCustomers(input);

      // 3. Return the result from the service
      return result;
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customers',
        cause: error,
      });
    }
  }),

  getById: protectedProcedure.input(getByIdInputSchema).query(async ({ ctx, input }) => {
    try {
      // 1. Instantiate CustomerService
      const customerService = new CustomerService(db, ctx);

      // 2. Delegate fetching to the service
      // The service method (CustomerService.getCustomerById) now handles existence check and NO userId filtering.
      const customer = await customerService.getCustomerById(input.id);

      // 3. Return result from service
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customer',
        cause: error,
      });
    }
  }),

  create: protectedProcedure.input(customerInput).mutation(async ({ ctx, input }) => {
    try {
      // 1. Instantiate services
      const customerService = new CustomerService(db, ctx);
      const authService = new AuthService(db, ctx);

      // 2. Get creatorId from AuthService
      const creatorId = authService.getUserId();

      // 3. Delegate creation to CustomerService
      const createdCustomer = await customerService.createCustomer(
        input // Pass validated input
      );

      // 4. Return result
      return createdCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create customer',
        cause: error,
      });
    }
  }),

  update: protectedProcedure
    .input(updateRouterInputSchema) // Use the schema with id
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input; // Separate id from the rest of the data

        // 1. Instantiate CustomerService
        const customerService = new CustomerService(db, ctx);

        // 2. Delegate update to the service
        const updatedCustomer = await customerService.updateCustomer(id, data);

        // 3. Return result
        return updatedCustomer;
      } catch (error) {
        console.error('Error updating customer:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
          cause: error,
        });
      }
    }),

  delete: protectedProcedure.input(deleteInputSchema).mutation(async ({ ctx, input }) => {
    try {
      // 1. Instantiate CustomerService
      const customerService = new CustomerService(db, ctx);

      // 2. Delegate deletion to the service
      const result = await customerService.deleteCustomer(input.id);

      // 3. Return result from service
      return result;
    } catch (error) {
      console.error('Error deleting customer:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete customer',
        cause: error,
      });
    }
  }),
});
