import { pgTable, text } from 'drizzle-orm/pg-core';

export default pgTable('guilds', {
  id: text('guildId').primaryKey().notNull(),
  voiceChannelId: text('voiceChannelId'),
});
