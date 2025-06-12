import SpotifyWebApi from 'spotify-web-api-node';
import { logger } from '../utils/log';

const log = logger.on('spotify');

interface SpotifySongData {
  link: string;
  coverImage: string | null;
}

export default class SpotifyClient {
  private readonly client: SpotifyWebApi | null = null;

  private readonly cache = new Map<string, SpotifySongData>();

  constructor() {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      log.error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set.');
    } else {
      this.client = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      });
      this.authenticate();
    }
  }

  /**
   * Fetches the song info from Spotify given a ISRC code.
   * @param isrc The ISRC code of the song.
   */
  async getSongInfoByISRC(isrc: string): Promise<SpotifySongData | undefined> {
    if (!this.client) return undefined;
    if (this.cache.has(isrc)) {
      return this.cache.get(isrc);
    }

    try {
      const data = await this.client.searchTracks(`isrc:${isrc}`);
      const tracks = data.body.tracks?.items;

      if (tracks && tracks.length > 0) {
        const link = tracks?.[0]?.external_urls?.spotify;
        if (!link) {
          log.warn(`No link found for ISRC: ${isrc}`);
          return undefined;
        }

        const coverImage = tracks?.[0]?.album?.images?.[0]?.url ?? null;
        const songData: SpotifySongData = {
          link,
          coverImage,
        };

        this.cache.set(isrc, songData);
        return songData;
      }

      log.warn(`No track found for ISRC: ${isrc}`);
      return undefined;
    } catch (error: any) {
      log.error(`Error fetching song link: ${error?.stack}`);
      return undefined;
    }
  }

  private authenticate() {
    this.client!.clientCredentialsGrant().then((r) => {
      this.client!.setAccessToken(r.body.access_token);
      log.info(`Spotify client authenticated. Expires in ${r.body.expires_in}.`);
      setTimeout(this.authenticate.bind(this), (r.body.expires_in - 2) * 1000);
    }).catch((error: any) => {
      log.error(`Failed to authenticate Spotify client: ${error?.stack}`);
    });
  }
}
