import WBOREmbed from "../structures/wbor-embed";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "recent",
  description: "Displays the recently played tracks on the station.",
  aliases: ["history", "his", "songs"],
};

export default async (ctx: Context): Promise<void> => {
  const data = ctx.client.currentNowPlaying;

  const recentlyPlayed = new WBOREmbed()
    .setThumbnail(data.now_playing.song.art)
    .setTitle(`Recently played tracks`);

  const songs: string[] = [];

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

  await ctx.message.reply({ embeds: [recentlyPlayed] });
};
