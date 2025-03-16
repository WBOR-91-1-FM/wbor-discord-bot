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
  const show = ctx.client.currentShow;

  let nowPlayingEmbed = new WBOREmbed()
    .setTitle(`Currently playing on WBOR`)
    .addFields({
      name: song.artist,
      value: song.title,
    })
    .setImage(song.art);

  if (show && !show.isAutomationBear) {
    nowPlayingEmbed = nowPlayingEmbed
      .setThumbnail(show.image)
      .setTitle(show.title)
      .setDescription(
        `${show.description}\n*${show.timeslot}* ${show.genre ? "- *" + show.genre + "*." : ""}`,
      )
      .setFooter({ text: `Hosted by ${show.host}` });
  }

  await ctx.message.reply({ embeds: [nowPlayingEmbed] });
};
