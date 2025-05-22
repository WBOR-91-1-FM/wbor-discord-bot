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
  const song: Song = ctx.client.currentSong;
  const show: SpinitronPlaylist = ctx.client.currentShow;

  // if the currently playing song doesn't have a cover,
  // use the current show's image (unless the show doesn't have an image).
  const songCover = song.art.includes('wbor.org') && show.image ? show.image : song.art;

  const spins = await ctx.client.spinitronClient.getSpins();
  const spotifyLink = spins?.[0]?.isrc
    ? await ctx.client.spotifyClient.getSongLink(spins![0].isrc)
    : undefined;

  let nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Currently playing on ${STATION_CALL_SIGN}`)
    .addFields({
      name: song.artist,
      value: song.title,
    })
    .setThumbnail(songCover);

  if (show && !show.automation) {
    nowPlayingEmbed = nowPlayingEmbed
      .setTitle(show.title)
      .setDescription(`${show.description}\n\n*${show.timeslot}*`)
      .setFooter({ text: `Hosted by ${makeSpinitronDJNames(show.personas)}` });

    nowPlayingEmbed.setFields([
      { name: 'Now Playing', value: `**${song.artist}** - ${song.title}` },
    ]);
  }

  let components: ActionRowBuilder | undefined;
  if (spotifyLink) {
    const button = new ButtonBuilder()
      .setLabel('Listen on Spotify')
      .setStyle(ButtonStyle.Link)
      .setURL(spotifyLink)
      .setEmoji(SPOTIFY_EMOJI_ID);

    components = new ActionRowBuilder().addComponents(button);
  }

  await ctx.message.reply({
    embeds: [nowPlayingEmbed],
    // @ts-expect-error
    components: components ? [components] : undefined,
  });
};
