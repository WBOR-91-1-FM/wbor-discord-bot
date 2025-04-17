import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  getVoiceConnection,
  AudioPlayerStatus,
  entersState,
  AudioResource,
} from '@discordjs/voice';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { Client, type VoiceBasedChannel } from 'discord.js';
import type WBORClient from '../client';
import type { Song } from './wbor';
import { logger } from './log.ts';

const log = logger.on('radio');

// Track connected channels
export const connectedChannels = new Set<string>();

// Stream object for reuse
let stream: ChildProcessWithoutNullStreams | null = null;

export function destroyStream() {
  if (stream) {
    stream.kill();
    stream = null;
  }
}

/**
 * Creates an FFmpeg stream for audio playback
 * @param url The URL of the audio stream
 * @returns Audio resource for playback
 */
function createFFmpegStream(url: string): AudioResource {
  if (stream) {
    return createAudioResource(stream.stdout, {
      inputType: StreamType.Arbitrary,
    });
  }

  const ffmpeg = spawn('ffmpeg', [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', url,
    '-f', 'mp3',
    '-ar', '48000', // discord expects either 41kHz or 48kHz
    '-ac', '2',
    '-bufsize', process.env.FFMPEG_BUFFER_SIZE || '1024k',
    '-loglevel', 'error',
    'pipe:1',
  ]);

  stream = ffmpeg;

  ffmpeg.on('error', (error) => {
    log.err(error);
    destroyStream();
  });

  ffmpeg.on('close', (code) => {
    log.warn(`FFMPEG process exited with code ${code}`);
    destroyStream();
  });

  return createFFmpegStream(url);
}

// clean up the stream or else it takes ages to exit
process.on('exit', destroyStream);

/**
 * Stops playing radio in a guild
 * @param guildId The ID of the guild
 */
function stopPlaying(guildId: string): void {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
    connectedChannels.delete(connection.joinConfig.channelId!);
  }
}

// Cache for stream URL
let streamURL: string | undefined;

/**
 * Fetches the stream URL from the API
 * @returns The URL of the audio stream
 */
export async function fetchStreamURL(): Promise<string> {
  // Return cached URL if available
  if (streamURL) return streamURL;

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
  streamURL = mount.url;
  return streamURL!;
}

/**
 * Starts playing the radio in a voice channel
 * @param channel The voice channel to join
 */
export async function playRadio(channel: VoiceBasedChannel): Promise<void> {
  // Destroy existing connection if any
  const existingConnection = getVoiceConnection(channel.guild.id);
  if (existingConnection) {
    existingConnection.destroy();
  }

  // Create a new connection to the voice channel
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  // Handle disconnection
  connection.on(VoiceConnectionStatus.Disconnected, () => {
    stopPlaying(channel.guild.id);
    connectedChannels.delete(channel.id);
  });

  // Create an audio player
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
      maxMissedFrames: 20,
    },
  });

  // Subscribe the connection to the player
  connection.subscribe(player);

  // Get the stream URL and create the resource
  const url = await fetchStreamURL();
  const resource = createFFmpegStream(url);

  player.on('error', (error) => {
    // We emit an idle event so the player can restart the resource and its stream if needed.
    player.emit(AudioPlayerStatus.Idle);
  });

  // Handle player idling (stream ends)
  player.on(AudioPlayerStatus.Idle, async () => {
    destroyStream();
    const newResource = createFFmpegStream(url);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5000);
      player.play(newResource);
    } catch (error: any) {
      log.err(error, 'Failed to play new resource');
    }
  });

  // Start playing
  player.play(resource);
  connectedChannels.add(channel.id);
}

/**
 * Updates the voice channel status to show current song
 * @param client Discord.js client
 * @param id Channel ID
 * @param song Song information object
 */
export async function updateChannelStatus(
  client: Client,
  id: string,
  song: { artist: string; title: string },
): Promise<void> {
  try {
    const channel = await client.channels.fetch(id);
    if (!channel) return;

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
    connectedChannels.delete(id);
  }
}

/*
 * Updates the status for all connected voice channels, given a Song
 */
export async function updateAllChannelStatuses(
  client: WBORClient,
  song: Song,
): Promise<void> {
  await Promise.allSettled(
    Array.from(connectedChannels).map((id) => updateChannelStatus(client, id, song)),
  );
}
