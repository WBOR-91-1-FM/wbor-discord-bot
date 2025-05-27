import { getVoiceConnection } from '@discordjs/voice';
import { GuildMember } from 'discord.js';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { logger } from '../utils/log.ts';

export const info: CommandInfo = {
  name: 'join',
  description: 'Joins the voice channel you are in and starts the radio.',
  noDM: true,
};

const log = logger.on('commands').on('join');

export default async (ctx: Context): Promise<void> => {
  const member = ctx.message.member as GuildMember;
  if (!member?.voice?.channel) {
    await ctx.message.reply(
      '🤔 Sorry, you need to be in a voice channel to use this command.',
    );
    return;
  }

  // we tell the bot to join this voice channel automatically later on
  ctx.guildEntity?.setVoiceChannel(member.voice.channel.id);

  const conn = getVoiceConnection(ctx.message.guild!.id);
  if (conn) {
    ctx.client.radioManager.disconnectFromChannel(ctx.message.guild!.id);
  }

  await ctx.defer();
  const err = await ctx.client.radioManager.playOnChannel(member.voice.channel.id, member.guild.id)
    .catch((error) => {
      log.err(error, 'Error while trying to join voice channel');
      return true;
    });

  if (err) {
    await ctx.message.reply(
      '❗ An error occurred while trying to join the voice channel. Please try again later.',
    );
    return;
  }

  await ctx.message.reply(
    `📻 You'll now be listening to **${ctx.client.currentSong.title}** on <#${member.voice.channel.id}>.`,
  );
};
