import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

export default pgTable('users', {
  id: text('userId').primaryKey().notNull(),
  lastFmSessionKey: text('lastFmSessionKey'),
  scrobbleAutomatically: boolean('scrobbleAutomatically').default(true),
});
