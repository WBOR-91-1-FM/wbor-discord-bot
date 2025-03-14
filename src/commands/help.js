import WBOREmbed from "../structures/wbor-embed.js";
import { commandRegistry } from "../structures/command-registry.js";

export default {
  name: "help",
  aliases: ["h"],
  private: false,
  description: "Get a list of all commands",
  execute: async (client, message) => {
    let commands = [];
    commandRegistry.commands.forEach((command) => {
      if (command.devOnly) return;

      let aliases = "";

      if (command.aliases) {
        command.aliases.forEach((alias) => {
          aliases += " `" + alias + "` ";
        });
      }

      commands.push({
        name: `${command.name}${aliases}`,
        value: command.description,
      });
    });

    const commandsEmbed = new WBOREmbed()
      .setTitle(`Welcome to WBOR`)
      .addFields(commands);

    message.reply({ embeds: [commandsEmbed] });
  },
};
