import { WBOR_API_URL } from "../constants";
import type {CommandInfo} from "../structures/commands/command";
import { Context } from "../structures/commands/context";

export const info: CommandInfo = {
  name: "ping",
  description: "Displays the ping of the bot and the status of the station.",
};

export default async (ctx: Context): Promise<void> => {
  try {
    const response = await fetch(WBOR_API_URL.replace("station/2", "status"));
    const data = await response.json() as { online: boolean };

    const text = data?.online
      ? "✅ WBOR is on air at <https://wbor.org>"
      : "❗ WBOR is down";

    await ctx.message.reply(
      `🏓 Took ${ctx.client.ws.ping}ms to receive your message.\n${text}`,
    );
  } catch (error) {
    // In case the fetch fails
    await ctx.message.reply(
      `🏓 Took ${ctx.client.ws.ping}ms to receive your message.\n❓ Could not determine WBOR's status`,
    );
  }
};
