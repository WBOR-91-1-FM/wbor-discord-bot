import WBOREmbed from "../structures/wbor-embed";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "show",
  description: "Sends what show is on air right now.",
  aliases: ["sh"],
};

export default async (ctx: Context) => {
  const show = ctx.client.currentShow;
  if (!show || show.isAutomationBear)
    return ctx.reply("😵‍💫 There are no shows on air right now.");

  const embed = new WBOREmbed()
    .setTitle(show.title)
    .setDescription(show.description)
    .setThumbnail(show.image)
    .setFields({
      name: "Hosted by",
      value: show.host,
    })
    .setFooter({ text: show.timeslot });

  await ctx.reply({ embeds: [embed] });
};
