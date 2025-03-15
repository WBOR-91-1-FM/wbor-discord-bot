import { getVoiceConnection } from "@discordjs/voice";
import * as radio from "../utils/radio";
import * as GuildUtils from "../utils/guilds";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "join",
  description: "Joins the voice channel you are in and starts the radio.",
  aliases: ["j", "play", "start"],
};

export default async (ctx: Context): Promise<void> => {
  if (!ctx.message.member?.voice?.channel) {
    await ctx.message.reply(
      "🤔 Sorry, you need to be in a voice channel to use this command.",
    );
    return;
  }

  const guildData = GuildUtils.getForGuild(ctx.message.guild!.id);

  // we tell the bot to join this voice channel automatically later on
  guildData.home = ctx.message.member.voice.channel.id;
  GuildUtils.writeForGuild(guildData);

  if (getVoiceConnection(ctx.message.guild!.id)) {
    getVoiceConnection(ctx.message.guild!.id)?.destroy();
  }

  const voiceChannel = ctx.message.member.voice.channel;
  radio.playRadio(voiceChannel);

  await radio.updateChannelStatus(
    ctx.client,
    voiceChannel.id,
    ctx.client.currentSong,
  );

  await ctx.message.reply(
    `📻 You\'ll now be listening to **${ctx.client.currentSong.title}** on <#${voiceChannel.id}>.`,
  );
};
