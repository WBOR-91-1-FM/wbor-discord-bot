import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { isShowFunctionalityAvailable } from '../constants';

export const info: CommandInfo = {
  name: 'show',
  description: 'Sends what show is on air right now.',
  // If any value in the array is false, the command will not be loaded.
  // Therefore, it won't be registered and won't be available to use.
  dependsOn: [isShowFunctionalityAvailable],
};

export default async (ctx: Context) => {
  const show = ctx.client.currentShow;
  if (!show || show.isAutomationBear) return ctx.reply('😵‍💫 There are no shows on air right now.');

  const embed = new WBOREmbed()
    .setTitle(show.title)
    .setDescription(show.description)
    .setThumbnail(show.image)
    .setFields(
      [
        {
          name: 'Hosted by',
          value: show.host,
        },
        {
          name: 'Genre',
          value: show.genre as unknown as string,
          inline: true,
        },
      ].filter((a) => a.value) as Array<{
        name: string;
        value: string;
        inline?: boolean;
      }>,
    )
    .setFooter({ text: show.timeslot });

  return ctx.reply({ embeds: [embed] });
};
