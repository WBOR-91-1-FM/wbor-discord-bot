import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { SPOTIFY_EMOJI_ID, STATION_CALL_SIGN } from '../constants';

export const info: CommandInfo = {
  name: 'song',
  description: 'Shows the currently playing song.',
};

export default async (ctx: Context): Promise<void> => {
  const songInfo = await ctx.getCurrentSongInfo();

  const nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Currently playing on ${STATION_CALL_SIGN}`)
    .addFields({
      name: songInfo.artist,
      value: songInfo.name,
    })
    .setThumbnail(songInfo.cover);

  let components: ActionRowBuilder | undefined;
  if (songInfo.spotifyLink) {
    const button = new ButtonBuilder()
      .setLabel('Listen on Spotify')
      .setStyle(ButtonStyle.Link)
      .setURL(songInfo.spotifyLink)
      .setEmoji(SPOTIFY_EMOJI_ID);

    components = new ActionRowBuilder().addComponents(button);
  }

  await ctx.message.reply({
    embeds: [nowPlayingEmbed],
    // @ts-expect-error
    components: components ? [components] : undefined,
  });
};
