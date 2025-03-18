import { STATION_CALL_SIGN, WBOR_API_URL } from "../constants";
import { CommandInfo } from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "listeners",
  description: "Displays the current listener count and bot statistics.",
};

export default async (ctx: Context): Promise<void> => {
  const response = await fetch(WBOR_API_URL);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  await ctx.message.reply(
    `🫂 Our server says there are currently **${
      data.mounts[0].listeners.current
    }** online listeners tuned in to **${STATION_CALL_SIGN}**.\nThe bot is in ${
      ctx.client.guilds.cache.size
    } guilds and knows ${ctx.client.users.cache.size} users, including you.`,
  );
};
