import { getVoiceConnection } from "@discordjs/voice";
import * as radio from "../utils/radio.js";
import * as GuildUtils from "../utils/guilds.js";
import { getNowPlaying } from "../utils/wbor.js";

export default {
  name: "join",
  aliases: ["j", "play", "start"],
  description: "Joins the voice channel you are in and starts the radio.",
  execute: async (client, message) => {
    if (!message.member?.voice?.channel) {
      return message.reply(
        "🤔 Sorry, you need to be in a voice channel to use this command.",
      );
    }

    const np = await getNowPlaying();

    // we tell the bot to join this voice channel automatically later on
    guildData.home = message.member.voice.channel.id;
    GuildUtils.writeForGuild(guildData);

    if (getVoiceConnection(message.guild.id)) {
      getVoiceConnection(message.guild.id).destroy();
    }

    const voiceChannel = message.member.voice.channel;
    radio.playRadio(voiceChannel);
    await radio.updateChannelStatus(
      client,
      voiceChannel.id,
      np.now_playing.song,
    );
    message.reply(
      `📻 You\'ll now be listening to **${np.now_playing.song.title}** on <#${voiceChannel.id}>.`,
    );
  },
};
