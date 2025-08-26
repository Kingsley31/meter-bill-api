import { sql } from 'drizzle-orm';
import {
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Define Meter Tariffs Table
export const meterTariffs = pgTable('meter_tariffs', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterNumber: varchar('meter_number').notNull(),
  meterId: uuid('meter_id').notNull(),
  areaId: uuid('area_id').notNull(),
  tariff: numeric('tariff'),
  effectiveFrom: timestamp('effective_from').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Define Area Tariffs Table
export const areaTariffs = pgTable('area_tariffs', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  areaName: varchar('area_name').notNull(),
  areaId: uuid('area_id').notNull(),
  tariff: numeric('tariff'),
  effectiveFrom: timestamp('effective_from').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
