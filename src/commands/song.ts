import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import WBOREmbed from '../structures/wbor-embed';
import type { CommandInfo } from '../structures/commands/command';
import type Context from '../structures/commands/context';
import { SPOTIFY_EMOJI_ID, STATION_CALL_SIGN } from '../constants';
import type { Song } from '../utils/wbor';

export const info: CommandInfo = {
    name: 'song',
    description: 'Shows the currently playing song.',
};

export default async (ctx: Context): Promise<void> => {
    const song: Song = ctx.client.currentSong;

    const songCover = song.art;

    const spins = await ctx.client.spinitronClient.getSpins();
    const spotifyLink = spins?.[0]?.isrc
        ? await ctx.client.spotifyClient.getSongLink(spins![0].isrc)
        : undefined;

    const nowPlayingEmbed = new WBOREmbed()
        .setTitle(`Currently playing on ${STATION_CALL_SIGN}`)
        .addFields({
            name: song.artist,
            value: song.title,
        })
        .setThumbnail(songCover);

    let components: ActionRowBuilder | undefined;
    if (spotifyLink) {
        const button = new ButtonBuilder()
            .setLabel('Listen on Spotify')
            .setStyle(ButtonStyle.Link)
            .setURL(spotifyLink)
            .setEmoji(SPOTIFY_EMOJI_ID);

        components = new ActionRowBuilder().addComponents(button);
    }

    await ctx.message.reply({
        embeds: [nowPlayingEmbed],
        // @ts-expect-error
        components: components ? [components] : undefined,
    });
};
