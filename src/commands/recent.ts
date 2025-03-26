import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';

export const info: CommandInfo = {
  name: 'recent',
  description: 'Displays the recently played tracks on the station.',
};

export default async (ctx: Context): Promise<void> => {
  const data = ctx.client.currentNowPlaying;

  const recentlyPlayed = new WBOREmbed()
    .setThumbnail(data.now_playing.song.art)
    .setTitle('Recently played tracks');

  const songs: string[] = [];

  songs.push(
    `**🎙️ NOW**: **${data.now_playing.song.artist}** - ${data.now_playing.song.title}\n`,
  );

  data.song_history.forEach((song) => {
    // convert unix timestamp to hh:mm in the 12-hour format
    const playedAt = new Date(song.played_at * 1000);
    const formattedTime = playedAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    songs.push(
      `**${formattedTime}** - **${song.song.artist}** - ${song.song.title}`,
    );
  });

  recentlyPlayed.setDescription(songs.join('\n'));
  recentlyPlayed.setTimestamp();

  await ctx.message.reply({ embeds: [recentlyPlayed] });
};
