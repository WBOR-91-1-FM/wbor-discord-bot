import { pgTable, text } from "drizzle-orm/pg-core";
import { db } from "../index";

export const guilds = pgTable("guilds", {
  id: text("guildId").primaryKey().notNull(),
  voiceChannelId: text("voiceChannelId"),
});
