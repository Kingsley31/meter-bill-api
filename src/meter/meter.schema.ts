import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Define Meter Table
export const meters = pgTable('meters', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterNumber: varchar('meter_number').unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  areaId: uuid('area_id').notNull(),
  areaName: varchar('area_name').notNull(),
  customerId: uuid('customer_id'),
  customerName: varchar('customer_name'),
  ctRating: numeric('ct_rating').notNull(),
  ctMultiplierFactor: numeric('ct_multiplier_factor').notNull(), //used for calculating consumtion
  purpose: varchar('purpose').notNull(), // consumer, audit, bulk
  type: varchar('type').notNull(), //measurement, calculated
  calculationReferenceMeterId: uuid('calculation_reference_meter_id'), // used for calculated meters
  hasMaxKwhReading: boolean('has_max_kwh_reading').default(true).notNull(),
  maxKwhReading: numeric('max_kwh_reading'),
  tariff: numeric('tariff'),
  currentKwhReading: numeric('current_kwh_reading'),
  lastBillKwhConsumption: numeric('last_bill_kwh_consumption'),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const meterSubmeters = pgTable('meter_sub_meters', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterId: uuid('meter_id')
    .notNull()
    .references(() => meters.id),
  subMeterId: uuid('sub_meter_id')
    .notNull()
    .references(() => meters.id),
  operator: varchar('operator').notNull(), //+,-,*
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const meterRelation = relations(meters, ({ many }) => ({
  subMeters: many(meterSubmeters, { relationName: 'parent_submeters' }),
}));

export const submeterRelations = relations(meterSubmeters, ({ one }) => ({
  meter: one(meters, {
    fields: [meterSubmeters.meterId],
    references: [meters.id],
    relationName: 'parent_submeters',
  }),
  submeter: one(meters, {
    fields: [meterSubmeters.subMeterId],
    references: [meters.id],
    relationName: 'submeter',
  }),
}));
