import WBOREmbed from '../structures/wbor-embed';
import { commandRegistry } from '../structures/commands/registry';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { STATION_CALL_SIGN } from '../constants';

export const info: CommandInfo = {
  name: 'help',
  description: 'Get a list of all commands',
};

export default async (ctx: Context): Promise<void> => {
  const commands: { name: string; value: string }[] = [];
  commandRegistry.commands.forEach((command) => {
    if (command.info.private) return;

    commands.push({
      name: `${command.info.name}`,
      value: command.info.description,
    });
  });

  const commandsEmbed = new WBOREmbed()
    .setTitle(`Welcome to ${STATION_CALL_SIGN}`)
    .addFields(commands);

  ctx.message.reply({ embeds: [commandsEmbed] });
};
