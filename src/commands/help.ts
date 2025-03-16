import WBOREmbed from "../structures/wbor-embed";
import { commandRegistry } from "../structures/commands/registry";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "help",
  description: "Get a list of all commands",
};

export default async (ctx: Context): Promise<void> => {
  let commands: { name: string; value: string }[] = [];
  commandRegistry.commands.forEach((command) => {
    if (command.info.private) return;

    commands.push({
      name: `${command.info.name}`,
      value: command.info.description,
    });
  });

  const commandsEmbed = new WBOREmbed()
    .setTitle(`Welcome to WBOR`)
    .addFields(commands);

  ctx.message.reply({ embeds: [commandsEmbed] });
};
