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
  location: varchar('location').notNull().default('none'), // location of the meter, e.g., building name, street
  customerId: uuid('customer_id'),
  customerName: varchar('customer_name'),
  totalCustomers: numeric('total_customers').default('0').notNull(),
  ctRating: numeric('ct_rating').notNull(),
  ctMultiplierFactor: numeric('ct_multiplier_factor').notNull(), //used for calculating consumtion
  purpose: varchar('purpose').notNull(), // consumer, audit, bulk, public power, generator power
  auditMeterId: varchar('audit_meter_id'), // id of the audit meter this meter is linked to
  auditMeterNumber: varchar('audit_meter_number'),
  type: varchar('type').notNull(), //measurement, calculated
  calculationReferenceMeterId: uuid('calculation_reference_meter_id'), // used for calculated meters
  hasMaxKwhReading: boolean('has_max_kwh_reading').default(true).notNull(),
  maxKwhReading: numeric('max_kwh_reading'),
  includedInTariffCalculation: boolean('included_in_tariff_calculation')
    .default(false)
    .notNull(),
  tariff: numeric('tariff'), // Current Meer Tariff
  currentKwhReading: numeric('current_kwh_reading'),
  currentKwhReadingDate: timestamp('current_kwh_reading_date'),
  currentKwhConsumption: numeric('current_kwh_consumption'),
  previousKwhReading: numeric('previous_kwh_reading'),
  previousKwhConsumption: numeric('previous_kwh_consumption'),
  previousKwhReadingDate: timestamp('previous_kwh_reading_date'),
  lastBillKwhConsumption: numeric('last_bill_kwh_consumption'),
  lastBillDate: timestamp('last_bill_date'),
  lastBillAmount: numeric('last_bill_amount'),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});
//Define Submeter Table
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
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Define Meter Reading Table
export const meterReadings = pgTable('meter_readings', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterNumber: varchar('meter_number').notNull(),
  meterId: uuid('meter_id')
    .notNull()
    .references(() => meters.id),
  readingDate: timestamp('reading_date').notNull(),
  kwhReading: numeric('kwh_reading').notNull(),
  prevKwhReading: numeric('prev_kwh_reading').notNull().default('0'),
  prevKwhReadingId: uuid('prev_kwh_reading_id'),
  kwhConsumption: numeric('kwh_consumption').notNull(), // consumption for the period
  tariffId: uuid('tariff_id'),
  tariff: numeric('tariff'),
  tariffType: varchar('tariff_type'),
  tariffEffectiveDate: timestamp('tariff_effective_date'),
  tariffEndDate: timestamp('tariff_end_date'),
  amount: numeric('amount'),
  meterImage: varchar('meter_image').notNull(), // URL or path to the meter image
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Define Meter Reading Update Log table
export const meterReadingUpdates = pgTable('meter_reading_updates', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  meterReadingId: uuid('meter_reading_id')
    .notNull()
    .references(() => meterReadings.id),
  readingDate: timestamp('reading_date').notNull(),
  kwhReading: numeric('kwh_reading').notNull(),
  kwhConsumption: numeric('kwh_consumption').notNull(),
  meterImage: varchar('meter_image').notNull(),
  reason: varchar('reason').notNull(), // Reason for the update
  previousKwhReading: numeric('previous_kwh_reading').notNull(),
  previousKwhConsumption: numeric('previous_kwh_consumption').notNull(),
  previousKwhReadingDate: timestamp('previous_kwh_reading_date'),
  previousMeterImage: varchar('previous_meter_image').notNull(),
  updatedBy: uuid('updated_by'), // User who made the update
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
});

export const meterRelation = relations(meters, ({ many }) => ({
  subMeters: many(meterSubmeters, { relationName: 'parent_submeters' }),
  readings: many(meterReadings),
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

export const meterReadingRelations = relations(meterReadings, ({ one }) => ({
  meter: one(meters, {
    fields: [meterReadings.meterId],
    references: [meters.id],
  }),
}));
