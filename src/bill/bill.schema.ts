import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// BillGenerationRequests
export const billGenerationRequests = pgTable('bill_generation_requests', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey()
    .notNull(),
  xRequestId: varchar('x_request_id').notNull().unique(),
  requestedByUserId: text('requested_by_user_id').notNull(),
  requestedByUserName: text('requested_by_user_name').notNull(),
  requestDate: timestamp('request_date').defaultNow().notNull(),
  completedDate: timestamp('completed_date'), // Date the request taks was completed
  scope: varchar('scope').notNull(), // e.g. area-wide, system-wide
  isConsolidated: boolean('is_consolidated').default(false).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  recipientType: varchar('recipient_type').notNull(), // customer | area-leader
  recipientId: uuid('recipient_id'),
  areaId: uuid('area_id'),
  areaName: varchar('area_name'),
  status: text('status').default('pending').notNull(), // pending | success | failed
  note: text('note'),
});

export type BillGenerationRequestCreateData =
  typeof billGenerationRequests.$inferInsert;
export type BillGenerationRequest = typeof billGenerationRequests.$inferSelect;

// Bills Table
export const bills = pgTable('bills', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  invoiceNumber: varchar('invoice_number').unique().notNull(),
  requestId: varchar('request_id').notNull(),
  generateByUserId: varchar('generate_by_user_id').notNull(),
  generateByUserName: varchar('generate_by_user_name').notNull(),
  pdfGenerated: boolean('pdf_generated').default(false).notNull(),
  pdfUrl: text('pdf_url').default(''),
  totalAmountDue: numeric('total_amount_due').notNull(),
  isConsolidated: boolean('is_consolidated').default(false).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  recipientType: varchar('recipient_type').notNull(), // customer | area-leader
  scope: varchar('scope').notNull(), // e.g. area-wide, system-wide
  areaId: uuid('area_id'),
  areaName: varchar('area_name'),
  paymentStatus: varchar('payment_status').default('pending').notNull(), // pending | paid
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CreateBill = typeof bills.$inferInsert;

// BillBreakdowns Table
export const billBreakdowns = pgTable('bill_breakdowns', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  billId: uuid('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),
  meterId: varchar('meter_id').notNull(),
  areaId: varchar('area_id').notNull(),
  location: varchar('location').notNull(),
  areaName: varchar('area_name').notNull(),
  meterNumber: varchar('meter_number').notNull(),
  lastReadDate: timestamp('last_read_date').notNull(),
  firstReadDate: timestamp('first_read_date').notNull(),
  firstReadKwh: numeric('first_read_kwh').notNull(),
  lastReadKwh: numeric('last_read_kwh').notNull(),
  totalConsumption: numeric('total_consumption').notNull(),
  tariff: numeric('tariff').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CreateBillBreakdown = typeof billBreakdowns.$inferInsert;
export type BillBreakdown = typeof billBreakdowns.$inferSelect;

// Recipients Table
export const recipients = pgTable('recipients', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  name: varchar('name').notNull(),
  phoneNumber: varchar('phone_number'),
  email: varchar('email').notNull(),
  billId: uuid('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),
  billSent: boolean('bill_sent').default(false).notNull(),
  createdAt: timestamp('created_at')
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at')
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CreateBillRecepient = typeof recipients.$inferInsert;
export type BillRecipient = typeof recipients.$inferSelect;

export const invoiceSequences = pgTable('invoice_sequences', {
  date: date('date').primaryKey(),
  lastNumber: integer('last_number').notNull(),
});

export const billRelations = relations(bills, ({ many }) => ({
  breakdowns: many(billBreakdowns),
  billRecipients: many(recipients),
}));

export const billBreakdownRelations = relations(billBreakdowns, ({ one }) => ({
  bill: one(bills, {
    fields: [billBreakdowns.billId],
    references: [bills.id],
  }),
}));

export const recipientRelations = relations(recipients, ({ one }) => ({
  bill: one(bills, {
    fields: [recipients.billId],
    references: [bills.id],
  }),
}));
