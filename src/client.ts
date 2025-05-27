import {
  ActivityType,
  Client,
  GatewayIntentBits,
  type Interaction,
  MessageFlags,
  Status,
  type VoiceBasedChannel,
} from 'discord.js';
import StateHandler from './structures/state-handler';
import SpinitronClient from './spinitron';
import { commandRegistry } from './structures/commands/registry';
import Context from './structures/commands/context';
import { cleanTrackTitle, logError } from './utils/misc';
import type { NowPlayingData, Song } from './utils/wbor';
import { getAllExistingVoiceChannels, getOrCreateGuild, GuildEntity } from './database/entities/guilds';
import { getOrCreateUser, UserEntity } from './database/entities/users';
import { logger } from './utils/log';
import type { SpinitronPlaylist } from './spinitron/types/playlist';
import SpotifyClient from './structures/spotify-client';
import { makeSpinitronDJNames } from './spinitron/utils';
import RadioManager from './structures/radio-manager';
import { isShowFunctionalityAvailable } from './constants';

const log = logger.on('client');

export default class WBORClient extends Client {
  stateHandler: StateHandler;

  spinitronClient = new SpinitronClient();

  spotifyClient = new SpotifyClient();

  radioManager: RadioManager;

  get currentNowPlaying() {
    return this.stateHandler.currentTrack;
  }

  get currentSong(): Song {
    return this.stateHandler.currentTrack?.now_playing.song;
  }

  get currentShow(): SpinitronPlaylist {
    return this.stateHandler.currentShow;
  }

  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });

    this.stateHandler = new StateHandler(this);
    this.radioManager = new RadioManager(this);

    this.on('ready', () => this.onReady());
    this.on('raw', (d: any) => this.radioManager.onRawPacket(d));
    this.on('interactionCreate', (interaction) => this.onInteractionCreate(interaction));
    this.serveHealthEndpoint();
  }

  get songPresenceText() {
    const currentShow = this.currentShow ?? {
      automation: true,
      title: '',
    };
    // remove metadata stuff from the track title
    const title = cleanTrackTitle(this.currentSong.title);
    // add " to the shot name if not present
    const quotedShowName = currentShow.title.startsWith?.('"')
      ? currentShow.title
      : `"${currentShow.title}"`;

    if (!currentShow.automation) {
      return `${this.currentSong.artist} - ${title} • ${quotedShowName}, with ${makeSpinitronDJNames(currentShow.personas)} 📻`;
    }
    return `${this.currentSong.artist} - ${this.currentSong.title} 🎶`;
  }

  updatePresence() {
    this.setListening(this.songPresenceText);
  }

  setUpPresenceUpdates() {
    this.stateHandler.on('trackChange', async (np: NowPlayingData) => {
      this.updatePresence();
      await this.radioManager.updateAllChannelStatus({
        title: np.now_playing.song.title,
        artist: np.now_playing.song.artist,
      });
    });

    this.stateHandler.on('showChange', () => this.updatePresence());
  }

  async joinChannels() {
    const voiceChannels = await getAllExistingVoiceChannels();

    try {
      await Promise.all(voiceChannels.map(async ({ guildId, voiceChannelId }) => {
        const channel = (await this.channels.fetch(voiceChannelId!)) as VoiceBasedChannel;
        if (!channel || !channel?.isVoiceBased()) return;

        await this.radioManager.playOnChannel(voiceChannelId!, guildId);
      }));

      this.radioManager.startHandlingFailures();
    } catch (e: any) {
      log.err(e, 'An error occurred while trying to connect to the default voice channels!');
    }
  }

  async onReady() {
    log.info('Connected to Discord. Waiting until initial data is received.');
    this.radioManager.onClientReady();
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

  // Test if the bot is healthy. In our context, that means:
  // 1. being connected to Discord and Lavalink
  // 2. having a current track and show (if applicable)
  isHealthy(): boolean {
    return (
      this.ws.status === Status.Ready // WebSocket is connected
        && this.radioManager.connected // Lavalink is connected
        && this.stateHandler.currentTrack !== null // Current track is set
        && (this.stateHandler.currentShow !== null || !isShowFunctionalityAvailable) // Show
    );
  }

  serveHealthEndpoint() {
    Bun.serve({
      routes: {
        '/health': () => {
          if (this.isHealthy()) {
            return new Response('OK', { status: 200 });
          }
          return new Response('Unhealthy...', { status: 503 });
        },
      },
      port: 3000,
    });
  }
}
