import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { SPOTIFY_EMOJI_ID, STATION_CALL_SIGN } from '../constants';
import type { SpinitronPlaylist } from '../spinitron/types/playlist';
import type { Song } from '../utils/wbor';
import { makeSpinitronDJNames } from '../spinitron/utils';

export const info: CommandInfo = {
  name: 'playing',
  description: 'Shows the currently playing song and show.',
};

export default async (ctx: Context): Promise<void> => {
  const songInfo = await ctx.getCurrentSongInfo();
  const show: SpinitronPlaylist = ctx.client.currentShow;

  let nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Currently playing on ${STATION_CALL_SIGN}`)
    .addFields({
      name: songInfo.artist,
      value: songInfo.name,
    })
    .setThumbnail(songInfo.cover);

  if (show && !show.automation) {
    nowPlayingEmbed = nowPlayingEmbed
      .setTitle(show.title)
      .setDescription(`${show.description}\n\n*${show.timeslot}*`)
      .setFooter({ text: `Hosted by ${makeSpinitronDJNames(show.personas)}` });

    nowPlayingEmbed.setFields([
      { name: 'Now Playing', value: `**${songInfo.artist}** - ${songInfo.name}` },
    ]);
  }

  let components: ActionRowBuilder | undefined;
  if (songInfo.spotifyLink) {
    const button = new ButtonBuilder()
      .setLabel('Listen to song on Spotify')
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
