import { getVoiceConnection } from '@discordjs/voice';
import { GuildMember, PermissionFlagsBits, TextChannel } from 'discord.js';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';

export const info: CommandInfo = {
  name: 'leave',
  description: 'Leaves the voice channel you are in and stops the radio.',
  noDM: true,
};

export default async (ctx: Context): Promise<void> => {
  if (!ctx.message.guild) {
    await ctx.message.reply('🙅‍♂️ This command can only be used in a server.');
    return;
  }

  const memberPermissions = (ctx.message.channel as TextChannel).permissionsFor(
    ctx.message.member! as GuildMember,
  );

  if (
    !memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    && !memberPermissions?.has(PermissionFlagsBits.Administrator)
  ) {
    await ctx.message.reply(
      "🙅‍♂️ Sorry, you don't have permission to use that command.",
    );
    return;
  }

  ctx.client.radioManager.disconnectFromChannel(ctx.message.guild.id);

  await ctx.guildEntity?.unsetVoiceChannel();
  await ctx.message.reply('👋 Bye.');
};
