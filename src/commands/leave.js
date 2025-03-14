import { getVoiceConnection } from "@discordjs/voice";
import Discord from "discord.js";

export default {
  name: "leave",
  aliases: ["l", "exit", "stop", "quit"],
  description: "Leaves the voice channel you are in and stops the radio.",
  execute: async (client, message) => {
    if (!message.guild)
      return message.reply("🙅‍♂️ This command can only be used in a server.");

    if (
      !message.channel
        .permissionsFor(message.member)
        .has(Discord.PermissionFlagsBits.ManageGuild) ||
      !message.channel
        .permissionsFor(message.member)
        .has(Discord.PermissionFlagsBits.Administrator)
    ) {
      return message.reply(
        "🙅‍♂️ Sorry, you don't have permission to use that command.",
      );
    }

    if (!getVoiceConnection(message.guild.id))
      return message.reply("🤔 I am not connected to a voice channel.");

    getVoiceConnection(message.guild.id).destroy();

    message.reply("👋 Bye.");
  },
};
