import { relations, sql } from 'drizzle-orm';
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

// Define Area Tariffs Table
export const areaTariffs = pgTable('area_tariffs', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  areaName: varchar('area_name').notNull(),
  areaId: uuid('area_id')
    .notNull()
    .references(() => areas.id),
  tariff: numeric('tariff'),
  effectiveFrom: timestamp('effective_from').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Define Area Leader Table
export const areaLeaders = pgTable('area_leaders', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  areaName: varchar('area_name').notNull(),
  areaId: uuid('area_id')
    .notNull()
    .references(() => areas.id),
  leaderId: uuid('leader_id').notNull(),
  leaderName: varchar('leader_name').notNull(),
  leaderPhone: varchar('leader_phone'),
  leaderEmail: varchar('leader_email').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const areaLeaderRelations = relations(areaLeaders, ({ one }) => ({
  area: one(areas, {
    fields: [areaLeaders.areaId],
    references: [areas.id],
  }),
}));
