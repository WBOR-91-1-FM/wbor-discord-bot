import { Manager, Player, Track } from 'moonlink.js';
import type WBORClient from '../client.ts';
import { logger } from '../utils/log.ts';
import type Context from './commands/context.ts';

const log = logger.on('lavalink');

export default class RadioManager {
  streamURL: string | undefined
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
    this.manager.on('nodeConnected', () => this.onConnected());
    this.manager.on('queueEnd', (player: Player) => this.onQueueEnd(player));
  }

  sendPayload(guildId: string, payload: string) {
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(JSON.parse(payload));
  }

  onConnected() {
    log.info('Successfully connected to node.');
  }

  onErr(e: any) {
    log.error(`Lavalink node encountered an error: ${e}`);
  }

  onClientReady() {
    this.manager.init(this.client.user!.id);
  }

  onRawPacket(d: any) {
    this.manager.packetUpdate(d);
  }

  async onQueueEnd(player: Player) {
    log.warn('Queue ended? Refreshing mount URL and reconnecting in 2s...')
    this.streamURL = undefined

    setTimeout(() => {
      this.findStreamAndPlay(player)
    }, 2000)
  }

  async playOnChannel(voiceChannelId: string, guildId: string) {
    if (this.manager.getPlayer(guildId)) {
      if (this.manager.getPlayer(guildId).playing) return // we're already playing...
    }

    const player = this.manager.createPlayer({
      voiceChannelId,
      guildId,
      textChannelId: '',
      autoPlay: true
    })

    player.connect({ setDeaf: true })

    await this.findStreamAndPlay(player)
    await this.updateChannelStatus(voiceChannelId, this.client.currentSong)
  }

  async findStreamAndPlay(player: Player) {
    const result = await this.manager.search({
      query: await this.fetchStreamURL()
    })
    if (!result.tracks[0]) {
      log.error('Couldn\'t load WBOR stream URL... Retrying in 5s.')
      return setTimeout(() => this.findStreamAndPlay(player), 5000)
    }

    player.queue.add(result.tracks[0]);
    if (!player.playing) player.play();
  }

  async updateAllChannelStatus(song: { artist: string; title: string }) {
    await Promise.allSettled(
      this.manager.players.all
        .map(a => a.voiceChannelId)
        .map((id) => this.updateChannelStatus(id, song))
    )
  }

  async updateChannelStatus(
    id: string,
    song: { artist: string; title: string },
  ): Promise<void> {
    try {
      const status = `🎶 ${song.artist} - ${song.title}`;

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
  }

  disconnectFromChannel(guildId: string) {
    this.manager.getPlayer(guildId)?.disconnect()
  }
}
