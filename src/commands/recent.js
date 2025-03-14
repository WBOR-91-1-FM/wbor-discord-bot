import WBOREmbed from "../structures/wbor-embed.js";
import { getNowPlaying } from "../utils/wbor.js";

export default {
  name: "recent",
  aliases: ["history", "his", "songs"],
  description: "Displays the recently played tracks on the station.",
  private: false,
  execute: async (client, message) => {
    getNowPlaying()
      .then((data) => {
        const recentlyPlayed = new WBOREmbed()
          .setThumbnail(data.now_playing.song.art)
          .setTitle(`Recently played tracks`);

        const songs = [];

        songs.push(
          `**NOW**: ${data.now_playing.song.title}, by **${data.now_playing.song.artist}**\n`,
        );

        data.song_history.forEach((song) => {
          // convert unix timestamp to hh:mm in the 12-hour format
          const playedAt = new Date(song.played_at * 1000);
          const formattedTime = playedAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          });

          songs.push(
            `**${formattedTime}** - ${song.song.title}, by **${song.song.artist}**`,
          );
        });

        recentlyPlayed.setDescription(songs.join("\n"));

        recentlyPlayed.setTimestamp();
        message.reply({ embeds: [recentlyPlayed] });
      })
      .catch((err) => {
        console.log(err);
        message.reply("☹️ Sorry, something went wrong.");
      });
  },
};
