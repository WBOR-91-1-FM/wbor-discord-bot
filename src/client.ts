import {
  ActivityType,
  Client,
  GatewayIntentBits,
  type Interaction,
  MessageFlags,
  type VoiceBasedChannel,
} from 'discord.js';
import StateHandler from './structures/state-handler';
import { commandRegistry } from './structures/commands/registry';
import Context from './structures/commands/context';
import { cleanTrackTitle, logError } from './utils/misc';
import {
  playRadio,
  updateAllChannelStatuses,
  updateChannelStatus,
} from './utils/radio';
import type { NowPlayingData } from './utils/wbor';
import {
  getAllExistingVoiceChannels,
  getOrCreateGuild,
  GuildEntity,
} from './database/entities/guilds';
import { getOrCreateUser, UserEntity } from './database/entities/users';
import { logger } from './utils/log';

const log = logger.on('client');

export default class WBORClient extends Client {
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
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });

    this.on('ready', () => this.onReady());
    this.on('interactionCreate', (interaction) => this.onInteractionCreate(interaction));
  }

  get songPresenceText() {
    const currentShow = this.currentShow ?? {
      isAutomationBear: true,
      title: '',
    };
    // remove metadata stuff from the track title
    const title = cleanTrackTitle(this.currentSong.title);
    // add " to the shot name if not present
    const quotedShowName = currentShow.title.startsWith?.('"')
      ? currentShow.title
      : `"${currentShow.title}"`;

    if (!currentShow.isAutomationBear) {
      return `${this.currentSong.artist} - ${title} • ${quotedShowName}, with ${currentShow.host} 📻`;
    }
    return `${this.currentSong.artist} - ${this.currentSong.title} 🎶`;
  }

  updatePresence() {
    this.setListening(this.songPresenceText);
  }

  setUpPresenceUpdates() {
    this.stateHandler.on('trackChange', async (np: NowPlayingData) => {
      this.updatePresence();
      await updateAllChannelStatuses(this, np.now_playing.song);
    });

    this.stateHandler.on('showChange', () => this.updatePresence());
  }

  async joinChannels() {
    const voiceChannels = await getAllExistingVoiceChannels();

    voiceChannels.map(async (vc) => {
      const channel = (await this.channels.fetch(vc!)) as VoiceBasedChannel;
      if (!channel || !channel?.isVoiceBased()) return;

      await playRadio(channel)
        .then(() => updateChannelStatus(this, channel.id, this.currentSong))
        .catch((err) => log.err(
          err,
          `failed to play radio in ${channel.name} (${channel.id})`,
        ));
    });
  }

  async onReady() {
    log.info('Connected to Discord. Waiting until connected to AzuraCast');
    await this.stateHandler.waitForTrack();
    await this.stateHandler.waitForShow();
    this.updatePresence();
    this.setUpPresenceUpdates();

    // should we update the commands globally?
    if (process.env.DISCORD_UPDATE_COMMANDS === 'true') {
      await commandRegistry.registerApplicationCommands(
        this.user!.id,
        process.env.DISCORD_BOT_TOKEN!,
      );
    }

    // if there's a testing guild defined, update the commands there too
    if (process.env.DISCORD_TESTING_GUILD) {
      await commandRegistry.registerApplicationCommands(
        this.user!.id,
        process.env.DISCORD_BOT_TOKEN!,
        process.env.DISCORD_TESTING_GUILD,
      );
    }

    await this.joinChannels();
  }

  async onInteractionCreate(interaction: Interaction) {
    // once a command gets in, it is likely that the bot is connected to AzuraCast.
    // but we must wait anyway to avoid any potential issues
    await this.stateHandler.waitForTrack();
    if (!interaction.isChatInputCommand()) return;

    const command = commandRegistry.findByName(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: "🤔 Sorry, this command doesn't seem to exist.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (command.info.noDM && interaction.channel?.isDMBased()) {
      await interaction.reply({
        content: '☹️ Sorry, this command cannot be used in DMs.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userData = await getOrCreateUser(interaction.user.id);
    const guildData = interaction.channel?.isDMBased()
      ? null
      : await getOrCreateGuild(interaction.guildId!);

    const ctx = new Context(interaction, this, {
      guildEntity: guildData ? new GuildEntity(guildData) : null,
      userEntity: new UserEntity(userData!),
    });

    if (!commandRegistry.shouldRunCommand(command, ctx)) {
      await interaction.reply({
        content: "☹️ Sorry, you don't have permission to run this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.default(ctx);
    } catch (error: any) {
      logError(new Date(), error);
      await interaction.reply({
        content: '☹️ Sorry, an error occurred while executing this command.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  setListening(text: string) {
    return this.user?.setPresence({
      activities: [
        {
          name: text,
          type: ActivityType.Listening,
        },
      ],
    });
  }
}
