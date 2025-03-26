/*
 * Defines the class instance that is given to every command execution, the Context.
 * It contains the message, the author, the channel, the guild, and the client.
 * We store the message and the client and use getters for the rest.
 * We also use define the answer method, which is basically message.reply without
 * mentioning the author.
 */
import {
  CommandInteraction,
  Guild,
  GuildMember,
  type InteractionReplyOptions,
  InteractionResponse,
  MessagePayload,
  User,
  type VoiceBasedChannel,
} from 'discord.js';
import type { WBORClient } from '../../client';
import type { GuildEntity } from '../../database/entities/guilds';
import type { UserEntity } from '../../database/entities/users';

export default class Context {
  guildEntity: GuildEntity | null;

  userEntity: UserEntity;

  constructor(
    public message: CommandInteraction,
    public client: WBORClient,
    { guildEntity, userEntity }: { guildEntity: GuildEntity | null; userEntity: UserEntity },
  ) {
    this.message = message;
    this.client = client;
    this.guildEntity = guildEntity;
    this.userEntity = userEntity;
  }

  get author(): User {
    return this.message.user;
  }

  get channel() {
    return this.message.channel;
  }

  get guild(): Guild | null {
    return this.message.guild;
  }

  get voiceChannel(): VoiceBasedChannel | null {
    return (
      (this.message.member as GuildMember | undefined)?.voice.channel || null
    );
  }

  async answer(content: string | MessagePayload): Promise<InteractionResponse> {
    return this.message.reply(content);
  }

  reply(data: string | InteractionReplyOptions): Promise<InteractionResponse> {
    return this.message.reply(data);
  }
}
