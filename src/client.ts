import {
  ActivityType,
  Client,
  GatewayIntentBits,
  Guild,
  Interaction,
  MessageFlags,
} from "discord.js";
import { StateHandler } from "./structures/state-handler";
import { commandRegistry } from "./structures/commands/registry";
import { Context } from "./structures/commands/context";
import { logError } from "./utils/misc";
import { getForGuild, loadGuildData } from "./utils/guilds";
import {
  playRadio,
  updateAllChannelStatuses,
  updateChannelStatus,
} from "./utils/radio";
import { NowPlayingData } from "./utils/wbor";

export class WBORClient extends Client {
  stateHandler = new StateHandler();

  get currentNowPlaying() {
    return this.stateHandler.currentTrack;
  }

  get currentSong() {
    return this.stateHandler.currentTrack?.now_playing.song;
  }

  get currentShow() {
    return this.stateHandler.currentShow;
  }

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.on("ready", () => this.onReady());
    this.on("interactionCreate", (interaction) =>
      this.onInteractionCreate(interaction),
    );
    this.on("guildCreate", (guild) => this.onGuildCreate(guild));

    this.stateHandler.on("trackChange", async (np: NowPlayingData) => {
      this.user?.setPresence({
        activities: [
          {
            name: `${np.now_playing.song.artist} - ${np.now_playing.song.title}`,
            type: ActivityType.Listening,
          },
        ],
      });

      await updateAllChannelStatuses(this, np.now_playing.song);
    });
  }

  async joinChannels() {
    const guildData = loadGuildData();

    for (let serverData of guildData) {
      if (!serverData.home) return;

      const channel = await this.channels.fetch(serverData.home);
      if (!channel?.isVoiceBased()) continue;

      await playRadio(channel)
        .then(() => updateChannelStatus(this, channel.id, this.currentSong))
        .catch((err) =>
          console.error(
            `failed to play radio in ${channel.name} (${channel.id})`,
            err,
          ),
        );
    }
  }

  async onReady() {
    console.log(`Connected to Discord. Waiting until connected to Azuracast`);
    await this.stateHandler.waitForTrack();

    if (process.env.UPDATE_COMMANDS === "true") {
      await commandRegistry.registerApplicationCommands(
        this.user!.id,
        process.env.BOT_TOKEN!,
      );
    }

    await this.joinChannels();
  }

  async onGuildCreate(guild: Guild) {
    getForGuild(guild.id);
  }

  async onInteractionCreate(interaction: Interaction) {
    // once a command gets in, it is likely that the bot is connected to Azuracast. but we must wait anyways to avoid any potential issues
    await this.stateHandler.waitForTrack();
    if (!interaction.isChatInputCommand()) return;

    const command = commandRegistry.findByName(interaction.commandName);
    if (!command)
      return interaction.reply({
        content: "🤔 Sorry, this command doesn't seem to exist.",
        flags: MessageFlags.Ephemeral,
      });

    const ctx = new Context(interaction as any, this);
    try {
      await command.default(ctx);
    } catch (error) {
      logError(new Date(), error);
      interaction.reply({
        content: "☹️ Sorry, an error occurred while executing this command.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
