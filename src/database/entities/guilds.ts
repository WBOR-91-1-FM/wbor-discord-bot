import { eq, isNotNull, and } from 'drizzle-orm';
import guilds from '../schemas/guild';
import db from '..';

export const getOrCreateGuild = async (guildId: string) => {
  const existingGuild = await db
    .select()
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1)
    .execute();

  if (existingGuild[0]) return existingGuild[0];

  return db
    .insert(guilds)
    .values({ id: guildId })
    .returning()
    .execute()
    .then((data) => data[0]);
};

/*
 * Returns an array of set voice channels so we can connect to them after booting up
 */
export const getAllExistingVoiceChannels = async () => {
  const gds = await db
    .select()
    .from(guilds)
    .where(isNotNull(guilds.voiceChannelId))
    .execute();

  return gds.map((guild) => ({
    voiceChannelId: guild.voiceChannelId,
    guildId: guild.id
  }));
};

/**
* Tells us whether this server has a set voice channel
*/
export const hasVoiceChannelSet = async (guildId: string) => {
  const gds = await db
    .select()
    .from(guilds)
    .where(and(
      isNotNull(guilds.voiceChannelId),
      eq(guilds.id, guildId)
    ))
    .execute();

  return !!gds[0];
}

export class GuildEntity {
  constructor(public data: typeof guilds.$inferSelect) { }

  async setVoiceChannel(channelId: string) {
    await db
      .update(guilds)
      .set({ voiceChannelId: channelId })
      .where(eq(guilds.id, this.data.id))
      .execute();
  }

  async unsetVoiceChannel() {
    await db
      .update(guilds)
      .set({ voiceChannelId: null })
      .where(eq(guilds.id, this.data.id))
      .execute();
  }
}
