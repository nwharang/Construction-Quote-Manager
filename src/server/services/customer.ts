import { db } from '@/server/db';
import { customers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export class CustomerService {
  async getAll() {
    return db.query.customers.findMany({
      with: {
        _count: {
          select: {
            quotes: true,
          },
        },
      },
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    });
  }
} 