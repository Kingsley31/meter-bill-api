import { sql } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Define User Table
export const meters = pgTable('meters', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterId: varchar('meter_id').notNull().unique(),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
