import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { isShowFunctionalityAvailable, STATION_NAME } from '../constants';
import type { SpinitronPlaylist } from '../spinitron/types/playlist';
import { makeSpinitronDJNames } from '../spinitron/utils';

export const info: CommandInfo = {
  name: 'show',
  description: 'Sends what show is on air right now.',
  // If any value in the array is false, the command will not be loaded.
  // Therefore, it won't be registered and won't be available to use.
  dependsOn: [isShowFunctionalityAvailable],
};

export default async (ctx: Context) => {
  const show: SpinitronPlaylist = ctx.client.currentShow;
  if (!show || show.automation) return ctx.reply('😵‍💫 There are no shows on air right now. Instead, the station is playing an [automated playlist](<https://playlists.wbor.org/WBOR/?layout=1>).');

  const embed = new WBOREmbed()
    .setTitle(show.title)
    .setDescription(show.description)
    .setThumbnail(show.image)
    .setFields(
      [
        {
          name: 'Hosted by',
          value: makeSpinitronDJNames(show.personas),
        },
        {
          name: 'Genre',
          value: show.category as unknown as string,
          inline: true,
        },
      ].filter((a) => a.value) as {
        name: string;
        value: string;
        inline?: boolean;
      }[],
    )
    .setFooter({ text: show.timeslot || STATION_NAME });

  return ctx.reply({ embeds: [embed] });
};
