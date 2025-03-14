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
} from "@discordjs/voice";
import { spawn } from "child_process";

export const connectedChannels = new Set();

let stream = null;
// Create a reusable function for FFmpeg stream creation
function createFFmpegStream(url) {
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

export async function playRadio(channel) {
  if (getVoiceConnection(channel.guild.id)) {
    getVoiceConnection(channel.guild.id).destroy();
  }

  const connection = joinVoiceChannel({
    channelId: channel ? channel.id : message.member.voice.channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    stopPlaying(channel.guild.id);
    connectedChannels.delete(channel.id);
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
      maxMissedFrames: 20,
    },
  });

  connection.subscribe(player);

  const url = await fetchStreamURL();
  console.log("using stream", url);

  // Use the reusable function to create the stream resource
  const resource = createFFmpegStream(url);

  // Add error handling for the player but keep it minimal
  player.on("error", (error) => {
    console.error("Player error:", error);
  });

  player.on(AudioPlayerStatus.Idle, async () => {
    console.log("Player went idle, restarting stream...");

    // Use the reusable function to create a new stream resource
    const newResource = createFFmpegStream(url);

    await entersState(connection, VoiceConnectionStatus.Ready, 5e3).catch(
      () => {},
    );
    player.play(newResource);
  });

  player.play(resource);
  connectedChannels.add(channel.id);
}

function stopPlaying(guildId) {
  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
  }
}

let streamURL;
export async function fetchStreamURL() {
  // we cache the stream url cause it's unlikely to change. if it does, it's easier to just reboot.
  if (streamURL) return streamURL;

  const response = await fetch(process.env.STATION_API_URL);
  const data = await response.json();

  streamURL = data.mounts[0].url;
  return streamURL;
}

export async function updateChannelStatus(client, id, song) {
  const channel = await client.channels.fetch(id);
  if (!channel) return;

  const status = `🎶 ${song.artist} - ${song.title}`;

  // this API is still undocumented and the discord.js team refuses to implement it, so...
  await fetch(`https://discord.com/api/v9/channels/${id}/voice-status`, {
    headers: {
      accept: "*/*",
      authorization: `Bot ${process.env.BOT_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ status: status }),
    method: "PUT",
  });
}
