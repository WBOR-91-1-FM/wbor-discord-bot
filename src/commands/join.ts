import { getVoiceConnection } from "@discordjs/voice";
import * as radio from "../utils/radio";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";
import { GuildMember } from "discord.js";

export const info: CommandInfo = {
  name: "join",
  description: "Joins the voice channel you are in and starts the radio.",
  aliases: ["j", "play", "start"],
  noDM: true,
};

export default async (ctx: Context): Promise<void> => {
  const member = ctx.message.member as GuildMember;
  if (!member?.voice?.channel) {
    await ctx.message.reply(
      "🤔 Sorry, you need to be in a voice channel to use this command.",
    );
    return;
  }

  // we tell the bot to join this voice channel automatically later on
  ctx.guildEntity?.setVoiceChannel(member.voice.channel.id);

  if (getVoiceConnection(ctx.message.guild!.id)) {
    getVoiceConnection(ctx.message.guild!.id)?.destroy();
  }

  radio.playRadio(member.voice.channel);

  await radio.updateChannelStatus(
    ctx.client,
    member.voice.channel.id,
    ctx.client.currentSong,
  );

  await ctx.message.reply(
    `📻 You\'ll now be listening to **${ctx.client.currentSong.title}** on <#${member.voice.channel.id}>.`,
  );
};
