import "dotenv/config";
import Discord, { MessageFlags } from "discord.js";
import { Client, GatewayIntentBits } from "discord.js";
import * as Utils from "./src/utils/utils.js";
import * as GuildUtils from "./src/utils/guilds.js";
import { playRadio, updateChannelStatus } from "./src/utils/radio.js";
import { commandRegistry } from "./src/structures/command-registry.js";
import { getNowPlaying } from "./src/utils/wbor.js";

const prefix = "-";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("ready", async () => {
  console.log("bot has started");

  client.user.setPresence({
    activities: [
      {
        name: "WBOR 91.1 FM",
        url: "https://wbor.org/",
        type: Discord.ActivityType.LISTENING,
      },
    ],
  });

  await commandRegistry.registerApplicationCommands(
    client.user.id,
    process.env.BOT_TOKEN,
  );

  let guildData = GuildUtils.loadGuildData();
  const np = await getNowPlaying();

  for (let serverData of guildData) {
    if (!serverData.home) return;

    const channel = await client.channels.fetch(serverData.home);
    await playRadio(channel)
      .then(() => updateChannelStatus(client, channel.id, np.now_playing.song))
      .catch((err) =>
        console.error(
          `failed to play radio in ${channel.name} (${channel.id})`,
          err,
        ),
      );
  }
});

client.on("guildCreate", (guild) => {
  GuildUtils.getForGuild(guild);

  return console.log(`The bot was added to: ${guild.name} (${guild.id})`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commandRegistry.findByName(commandName);
  if (!command) return;

  try {
    await command.execute(client, message);
  } catch (error) {
    Utils.logError(new Date(), error);
    message.channel.send(
      `☹️ We are sorry, but an error occurred. Please contact an admin.`,
    );
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandRegistry.findByName(interaction.commandName);
  if (!command)
    return interaction.reply({
      content: "Sorry, this command doesn't seem to exist.",
      flags: MessageFlags.Ephemeral,
    });

  try {
    await command.execute(client, interaction);
  } catch (error) {
    Utils.logError(new Date(), error);
    interaction.reply({
      content: "Sorry, an error occurred while executing this command.",
      flags: MessageFlags.Ephemeral,
    });
  }
});

client.login(process.env.BOT_TOKEN);
