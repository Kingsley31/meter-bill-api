import { relations, sql } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { meters } from 'src/meter/meter.schema';

// Define Customer Meter Table
export const customerMeters = pgTable('customer_meters', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterNumber: varchar('meter_number').notNull(),
  meterId: uuid('meter_id')
    .notNull()
    .references(() => meters.id),
  customerId: uuid('customer_id').notNull(),
  customerName: varchar('customer_name').notNull(),
  customerPhone: varchar('customer_phone'),
  customerEmail: varchar('customer_email').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const customerMeterRelations = relations(customerMeters, ({ one }) => ({
  meter: one(meters, {
    fields: [customerMeters.meterId],
    references: [meters.id],
  }),
}));
