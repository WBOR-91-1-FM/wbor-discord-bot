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
import {
  playRadio,
  updateAllChannelStatuses,
  updateChannelStatus,
} from "./utils/radio";
import { NowPlayingData } from "./utils/wbor";
import {
  getAllExistingVoiceChannels,
  getOrCreateGuild,
  GuildEntity,
} from "./database/entities/guilds";
import { getOrCreateUser, UserEntity } from "./database/entities/users";

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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.on("ready", () => this.onReady());
    this.on("interactionCreate", (interaction) =>
      this.onInteractionCreate(interaction),
    );

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
    const voiceChannels = await getAllExistingVoiceChannels();

    for (const vc of voiceChannels) {
      const channel = await this.channels.fetch(vc!);
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
    console.log(`Connected to Discord. Waiting until connected to AzuraCast`);
    await this.stateHandler.waitForTrack();

    // should we update the commands globally?
    if (process.env.UPDATE_COMMANDS === "true") {
      await commandRegistry.registerApplicationCommands(
        this.user!.id,
        process.env.BOT_TOKEN!,
      );
    }

    // if there's a testing guild defined, update the commands there too
    if (process.env.TESTING_GUILD) {
      await commandRegistry.registerApplicationCommands(
        this.user!.id,
        process.env.BOT_TOKEN!,
        process.env.TESTING_GUILD,
      );
    }

    await this.joinChannels();
  }

  async onInteractionCreate(interaction: Interaction) {
    // once a command gets in, it is likely that the bot is connected to AzuraCast. but we must wait anyways to avoid any potential issues
    await this.stateHandler.waitForTrack();
    if (!interaction.isChatInputCommand()) return;

    const command = commandRegistry.findByName(interaction.commandName);
    if (!command)
      return interaction.reply({
        content: "🤔 Sorry, this command doesn't seem to exist.",
        flags: MessageFlags.Ephemeral,
      });

    if (command.info.noDM && interaction.channel?.isDMBased())
      return interaction.reply({
        content: "☹️ Sorry, this command cannot be used in DMs.",
        flags: MessageFlags.Ephemeral,
      });

    const userData = await getOrCreateUser(interaction.user.id);
    const guildData = interaction.channel?.isDMBased()
      ? null
      : await getOrCreateGuild(interaction.guildId!);

    const ctx = new Context(interaction, this, {
      guildEntity: guildData ? new GuildEntity(guildData) : null,
      userEntity: new UserEntity(userData),
    });

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
