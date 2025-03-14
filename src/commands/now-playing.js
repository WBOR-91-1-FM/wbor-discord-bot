import { WBOR_API_URL } from "../constants.mjs";
import WBOREmbed from "../structures/wbor-embed.js";
import { getNowPlaying } from "../utils/wbor.js";

export default {
  name: "playing",
  aliases: ["np", "nowplaying", "current", "song"],
  private: false,
  description: "Shows the currently playing song.",
  execute: async (client, message) => {
    getNowPlaying()
      .then((data) => {
        const nowPlayingEmbed = new WBOREmbed()
          .setTitle(`Now playing`)
          .addFields({
            name: data.now_playing.song.artist,
            value: data.now_playing.song.title,
          })
          .setImage(data.now_playing.song.art);
        message.reply({ embeds: [nowPlayingEmbed] });
      })
      .catch((err) => {
        console.log(err);
        message.reply(L._U("http_error"));
      });
  },
};
