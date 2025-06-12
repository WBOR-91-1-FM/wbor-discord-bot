import { MessageFlags } from 'discord.js';
import { format, formatDistanceToNow } from 'date-fns';
import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { isShowFunctionalityAvailable, STATION_CALL_SIGN } from '../constants';
import type { SpinitronShow } from '../spinitron/types/show';
import { makeSpinitronDJNames } from '../spinitron/utils';

export const info: CommandInfo = {
  name: 'upcoming',
  description: 'Shows what shows are up next on WBOR.',
  // If any value in the array is false, the command will not be loaded.
  // Therefore, it won't be registered and won't be available to use.
  dependsOn: [isShowFunctionalityAvailable],
};

export default async (ctx: Context) => {
  const shows: SpinitronShow[] = await ctx.client.spinitronClient.getShows();
  if (!shows) return ctx.reply({ content: '😵‍💫 Sorry, I couldn\'t fetch upcoming shows. Try again later.', flags: MessageFlags.Ephemeral });

  if (shows.length === 0) return ctx.reply('😵‍💫 There are no upcoming shows.');

  let text = '';
  shows.forEach((show) => {
    // if the show is on right now, skip it
    if (show.start.valueOf() <= Date.now() && show.end.valueOf() >= Date.now()) return;

    const timeUntilStart = formatDistanceToNow(show.start, { addSuffix: true });
    const fromStartToEnd = `From ${format(show.start, 'h:mm a').toLowerCase()} to ${format(show.end, 'h:mm a').toLowerCase()}`;
    text += show.url ? `📻 **[${show.title}](${show.url})**\n` : `📻 **${show.title}**\n`;
    text += `🎙️ ${makeSpinitronDJNames(show.personas)}\n`;
    text += `⏰ ${fromStartToEnd}\n*(${timeUntilStart})*\n\n`;
  });

  const embed = new WBOREmbed()
    .setTitle(`Upcoming shows on ${STATION_CALL_SIGN}`)
    .setDescription(text)
    .setThumbnail(shows[0]?.image ?? ctx.client.currentSong.art)
    .setFooter({ text: 'All times are in Eastern Time.' });

  return ctx.reply({ embeds: [embed] });
};
