import { sql } from 'drizzle-orm';
import {
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Define Area Table
export const areas = pgTable('areas', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  areaName: varchar('area_name').notNull(),
  address: varchar('address').notNull(), // address of the area
  city: varchar('city').notNull(),
  state: varchar('state').notNull(),
  country: varchar('country').notNull(),
  totalMeters: numeric('total_meters').default('0').notNull(),
  type: varchar('type'),
  currentTariff: numeric('current_tariff'),
  totalKwhReading: numeric('total_kwh_reading'),
  totalKwhConsumption: numeric('total_kwh_consumption'),
  lastBillKwhConsumption: numeric('last_bill_kwh_consumption'),
  lastBillDate: timestamp('last_bill_date'),
  lastBillAmount: numeric('last_bill_amount'),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type AreaRecord = typeof areas.$inferSelect;
