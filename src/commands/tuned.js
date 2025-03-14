import { WBOR_API_URL } from "../constants.mjs";

export default {
  name: "listeners",
  aliases: [
    "tuned",
    "listenercount",
    "stationinfo",
    "stat",
    "info",
    "botinfo",
    "bi",
    "stats",
  ],
  description: "Displays the current listener count and bot statistics.",
  private: false,
  execute: async (client, message) => {
    fetch(WBOR_API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        message.reply(
          `🫂 Our server says there are currently **${
            data.mounts[0].listeners.current
          }** online listeners tuned in to **WBOR**.\nThe bot is in ${client.guilds.cache.size} guilds and knows ${client.users.cache.size} users, including you.`,
        );
      });
  },
};
