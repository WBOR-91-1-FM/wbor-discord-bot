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
  AudioPlayer,
  VoiceConnection,
} from "@discordjs/voice";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { Client, VoiceBasedChannel, Guild } from "discord.js";
import { WBORClient } from "../client";
import { Song } from "./wbor";

// Track connected channels
export const connectedChannels = new Set<string>();

// Stream object for reuse
let stream: ChildProcessWithoutNullStreams | null = null;

// clean up the stream or else it takes ages to exit
process.on("exit", () => {
  destroyStream();
});

/**
 * Creates an FFmpeg stream for audio playback
 * @param url The URL of the audio stream
 * @returns Audio resource for playback
 */
function createFFmpegStream(url: string): AudioResource {
  const ffmpeg =
    stream ||
    spawn("ffmpeg", [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-i",
      url,
      "-f",
      "mp3",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-bufsize",
      "1024k",
      "-loglevel",
      "error",
      "pipe:1",
    ]);

  if (!stream) {
    stream = ffmpeg;
  }

  return createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.Arbitrary,
  });
}

export async function destroyStream() {
  if (stream) {
    stream.kill();
    stream = null;
  }
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

  // Add error handling for the player
  player.on("error", (error) => {
    console.error("Player error:", error);
  });

  // Handle player idling (stream ends)
  player.on(AudioPlayerStatus.Idle, async () => {
    console.log("Player went idle, restarting stream...");

    let newResource = createFFmpegStream(url);
    if (newResource.ended || !newResource.readable) {
      // recreate the resource
      await destroyStream();
      newResource = createFFmpegStream(url);
    }

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5000);
      player.play(newResource);
    } catch (error) {}
  });

  // Start playing
  player.play(resource);
  connectedChannels.add(channel.id);
}

/**
 * Stops playing radio in a guild
 * @param guildId The ID of the guild
 */
function stopPlaying(guildId: string): void {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
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

  const response = await fetch(process.env.STATION_API_URL as string);
  const data = await response.json();

  streamURL = data.mounts[0].url;
  console.log(`Using stream URL: ${streamURL}`);
  return streamURL!;
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
        accept: "*/*",
        authorization: `Bot ${process.env.BOT_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: status }),
      method: "PUT",
    });
  } catch (error) {
    console.error("Error updating channel status:", error);
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
    Array.from(connectedChannels).map((id) =>
      updateChannelStatus(client, id, song).catch((error) => {
        console.error(`Error updating channel status for ${id}:`, error);
        connectedChannels.delete(id);
      }),
    ),
  );
}
