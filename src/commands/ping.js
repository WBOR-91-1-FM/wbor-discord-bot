import { WBOR_API_URL } from "../constants.mjs";

export default {
  name: "ping",
  description: "Displays the ping of the bot and the status of the station.",
  private: false,
  execute: async (client, message) => {
    const data = await fetch(WBOR_API_URL.replace("station/2", "status"))
      .then((response) => response.json())
      .catch((a) => null);
    const text = data?.online
      ? "✅ WBOR is on air at <https://wbor.org>"
      : "❗ WBOR is down";
    message.reply(
      `🏓 Took ${client.ws.ping}ms to receive your message.\n${text}`,
    );
  },
};
