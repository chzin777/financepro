import {
  pgTable,
  text,
  real,
  integer,
  boolean,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const balanceTable = pgTable('balance', {
  id: integer('id').primaryKey().default(1),
  amount: real('amount').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const transactionsTable = pgTable('transactions', {
  id: text('id').primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: real('amount').notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'income' | 'expense'
  category: varchar('category', { length: 50 }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const billsTable = pgTable('bills', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: real('amount').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  type: varchar('bill_type', { length: 15 }).notNull(), // 'fixed' | 'temporary'
  dueDay: integer('due_day').notNull(),
  totalInstallments: integer('total_installments'),
  currentInstallment: integer('current_installment'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
