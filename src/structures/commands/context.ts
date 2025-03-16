/*
 * Defines the class instance that is given to every command execution, the Context.
 * It contains the message, the author, the channel, the guild, and the client.
 * We store the message and the client and use getters for the rest.
 * We also use define the answer method, which is basically message.reply without mentioning the author.
 */
import {
  Guild,
  Message,
  MessagePayload,
  MessageReplyOptions,
  TextChannel,
  User,
  VoiceBasedChannel,
} from "discord.js";
import { WBORClient } from "../../client";

export class Context {
  constructor(
    public message: Message,
    public client: WBORClient,
  ) {
    this.message = message;
    this.client = client;
  }

  get author(): User {
    return this.message.author;
  }

  get channel(): TextChannel {
    return this.message.channel as TextChannel;
  }

  get guild(): Guild {
    return this.message.guild as Guild;
  }

  get voiceChannel(): VoiceBasedChannel | null {
    return this.message.member?.voice.channel || null;
  }

  async answer(content: string | MessagePayload): Promise<Message> {
    return this.message.reply(content);
  }

  reply(data: string | MessagePayload | MessageReplyOptions): Promise<Message> {
    return this.message.reply(data);
  }
}
