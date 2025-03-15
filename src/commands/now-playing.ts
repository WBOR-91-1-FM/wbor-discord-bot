import WBOREmbed from "../structures/wbor-embed";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "playing",
  description: "Shows the currently playing song.",
  aliases: ["np", "nowplaying", "current", "song"],
};

export default async (ctx: Context): Promise<void> => {
  const song = ctx.client.currentSong;

  const nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Now playing`)
    .addFields({
      name: song.artist,
      value: song.title,
    })
    .setImage(song.art);

  await ctx.message.reply({ embeds: [nowPlayingEmbed] });
};
