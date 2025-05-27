import {
  Manager, Node, Player, Track, type INode,
} from 'moonlink.js';
import { sleep } from 'bun';
import type WBORClient from '../client.ts';
import { logger } from '../utils/log.ts';
import { hasVoiceChannelSet } from '../database/entities/guilds.ts';

const log = logger.on('lavalink');

export default class RadioManager {
  streamURL: string | undefined;

  connected = false;

  handleFailures = false;

  manager = new Manager({
    nodes: [{
      host: process.env.LAVALINK_HOST!,
      port: process.env.LAVALINK_PORT ? parseInt(process.env.LAVALINK_PORT) : 2333,
      password: process.env.LAVALINK_PASSWORD!,
      secure: false,
    }],
    options: {
      resume: true,
      autoResume: true,
    },
    sendPayload: (guildId: string, payload: string) => this.sendPayload(guildId, payload),
  });

  constructor(
    public client: WBORClient,
  ) {
    this.manager.on('nodeConnected', () => this.onNodeConnected());
    this.manager.on('nodeDisconnect', () => this.onNodeDisconnected());
    this.manager.on('nodeAutoResumed', (n: INode, p: Player[]) => this.onNodeAutoResume(n, p));
    this.manager.on('queueEnd', (player: Player) => this.onQueueEnd(player));
    this.manager.on('socketClosed', (player) => this.onPlayerDisconnect(player));
    this.manager.on('nodeError', (n: INode, err: Error) => this.onNodeError(err));
  }

  sendPayload(guildId: string, payload: string) {
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(JSON.parse(payload));
  }

  // this is a thing because during restarts, lavalink will emit socketClosed, recreating the player
  // the problem is, players are automatically created on startup from db data. to avoid creating
  // multiple players, we ignore player issue events during startup.
  startHandlingFailures() {
    this.handleFailures = true;
  }

  isConnectedToGuild(guildId: string) {
    return this.manager.getPlayer(guildId);
  }

  onNodeConnected() {
    log.info('Successfully connected to node.');
    this.connected = true;
  }

  onNodeDisconnected() {
    log.warn('Lavalink node disconnected. Will reconnect.');
    this.connected = false;
    this.handleFailures = false; // stop handling failures until we reconnect
    this.manager.nodes.init();
  }

  async onNodeError(e: any) {
    log.err(e, 'Lavalink node encountered an error. Waiting a few seconds until reconnecting.');
    await sleep(5000);
    this.handleFailures = false;
    await this.client.joinChannels();
    this.handleFailures = true;
  }

  onClientReady() {
    this.manager.init(this.client.user!.id);
  }

  onRawPacket(d: any) {
    this.manager.packetUpdate(d);
  }

  onNodeAutoResume(node: INode, players: Player[]) {
    log.info(`Lavalink node autoresumed ${players.length} after restart`);
  }

  async onPlayerDisconnect(player: Player) {
    if (!this.handleFailures) return;

    const hasVC = await hasVoiceChannelSet(player.guildId);
    if (hasVC) {
      log.debug(`Player disconnected from guild ID ${player.guildId}; reconnecting...`);
      await this.playOnChannel(player.voiceChannelId, player.guildId);
    }
  }

  async onQueueEnd(player: Player) {
    log.warn('Queue ended? Refreshing mount URL and reconnecting in 2s...');
    this.streamURL = undefined;

    setTimeout(() => {
      this.findStreamAndPlay(player);
    }, 2000);
  }

  async playOnChannel(voiceChannelId: string, guildId: string) {
    const pl = this.manager.getPlayer(guildId);
    if (pl) {
      if (pl.playing) return; // we're already playing...
    }

    const player = this.manager.createPlayer({
      voiceChannelId,
      guildId,
      textChannelId: '', // this is optional. useful for music bots, not so much for radio
      autoPlay: true,
    });

    player.connect({ setDeaf: true });

    await this.findStreamAndPlay(player);
    await this.updateChannelStatus(voiceChannelId, this.client.currentSong);
  }

  async findStreamAndPlay(player: Player) {
    const result = await this.manager.search({
      query: await this.fetchStreamURL(),
    });
    if (!result.tracks[0]) {
      log.error('Couldn\'t load WBOR stream URL... Retrying in 5s.');
      setTimeout(() => this.findStreamAndPlay(player), 5000);
      return;
    }

    player.queue.add(result.tracks[0]);
    if (!player.playing) await player.play();
  }

  async updateAllChannelStatus(song: { artist: string; title: string }) {
    await Promise.allSettled(
      this.manager.players.all
        .map((a) => a.voiceChannelId)
        .map((id) => this.updateChannelStatus(id, song)),
    );
  }

  async updateChannelStatus(
    id: string,
    song: { artist: string; title: string },
  ): Promise<void> {
    await this.client.stateHandler.waitForTrack();
    try {
      const status = `🎶 ${song.artist} - ${song.title}`;
      log.debug(`Setting ${id} to ${status}`);

      // Undocumented Discord API for setting voice channel status
      await fetch(`https://discord.com/api/v9/channels/${id}/voice-status`, {
        headers: {
          accept: '*/*',
          authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ status }),
        method: 'PUT',
      });
    } catch (error: any) {
      log.err(error, `Failed to update channel status for ${id}`);
    }
  }

  /*
   * Fetches the stream URL from the API
   * @returns The URL of the audio stream
   */
  async fetchStreamURL(): Promise<string> {
    // Return cached URL if available
    if (this.streamURL) return this.streamURL;

    try {
      const response = await fetch(process.env.AZURACAST_API_URL as string);
      const data = (await response.json()) as { mounts: { url: string }[] };

      log.debug(`${data.mounts.length} mounts found:\n  -> ${data.mounts.map((mount: any) => `(${mount.id}) ${mount.name} (${mount.url})`).join('\n  -> ')}`);

      let mount: any = data.mounts.find((m: any) => m.is_default) || data.mounts[0];
      if (process.env.AZURACAST_MOUNT_ID) {
        const pickedMount = data.mounts.find((m: any) => m.id === process.env.AZURACAST_MOUNT_ID);
        if (!pickedMount) {
          throw new Error(`Mount ID ${process.env.AZURACAST_MOUNT_ID} not found.`);
        }
        mount = pickedMount;
      }
      if (!mount) throw new Error('No mounts were found.');

      log.info(`Using mount ID ${mount.id} (${mount.name}; ${mount.url})`);
      this.streamURL = mount.url;
      return this.streamURL!;
    } catch (e: any) {
      log.err(e, 'Failed to get mount points from AzuraCast. Retrying in 2s...');
      return new Promise((r) => {
        setTimeout(() => r(this.fetchStreamURL()), 2000);
      });
    }
  }

  disconnectFromChannel(guildId: string) {
    this.manager.getPlayer(guildId)?.disconnect();
  }
}
