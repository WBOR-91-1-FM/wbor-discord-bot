import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { STATION_CALL_SIGN } from '../constants';

export const info: CommandInfo = {
  name: 'playing',
  description: 'Shows the currently playing song.',
};

export default async (ctx: Context): Promise<void> => {
  const song = ctx.client.currentSong;
  const show = ctx.client.currentShow;

  // if the currently playing song doesn't have a cover,
  // use the current show's image (unless the show doesn't have an image).
  const songCover = song.art.includes('wbor.org') && show.image ? show.image : song.art;

  let nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Currently playing on ${STATION_CALL_SIGN}`)
    .addFields({
      name: song.artist,
      value: song.title,
    })
    .setThumbnail(songCover);

  if (show && !show.isAutomationBear) {
    nowPlayingEmbed = nowPlayingEmbed
      .setTitle(show.title)
      .setDescription(`${show.description}\n\n*${show.timeslot}*`)
      .setFooter({ text: `Hosted by ${show.host}` });

    nowPlayingEmbed.setFields([
      { name: 'Now Playing', value: `**${song.artist}** - ${song.title}` },
    ]);
  }

  await ctx.message.reply({ embeds: [nowPlayingEmbed] });
};
