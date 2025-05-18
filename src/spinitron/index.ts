import { fetchWithRetries } from 'fetch-with-retries';
import { makeSpinitronPlaylist, type SpinitronPlaylist } from './types/playlist';
import { makeSpinitronShow, type SpinitronShow } from './types/show';
import { getItemOrArray } from './utils';
import type { SpinitronItem } from './types/common';
import { PERSONA_TTL, SHOW_TTL } from './cache';
import { sleepRandom } from '../utils/misc';
import { makeSpinitronSpins, type SpinitronSpin } from './types/spin';

export default class SpinitronClient {
  rootURL = process.env.SPINITRON_PROXY_URL;

  cacheMap = new Map<string, { created: number, val: any }>();

  async getCurrentShow(): Promise<SpinitronPlaylist | undefined> {
    const playlists = await this.getPlaylists();
    return playlists[0];
  }

  async getSpins(): Promise<SpinitronSpin[]> {
    let spins = await this.cachedRequest('/spins', 30)
      .then(makeSpinitronSpins);

    spins = await Promise.all(spins.map(async (spin) => this.fetchItemLinks(spin)));

    return spins;
  }

  /**
   * Fetches shows from the Spinitron API. Useful for getting upcoming shows.
   */
  async getShows(): Promise<SpinitronShow[]> {
    let shows = await this.cachedRequest('/shows', 30)
      .then(makeSpinitronShow);

    shows = await Promise.all(shows.map(async (show) => this.fetchItemLinks(show)));

    return shows.map((show) => ({
      ...show,
    })).slice(0, 6);
  }

  /**
   * Fetches the playlists from the Spinitron API.
   */
  async getPlaylists(): Promise<SpinitronPlaylist[]> {
    let playlists = await this.cachedRequest('/playlists', 30)
      .then(makeSpinitronPlaylist);

    playlists = await Promise.all(playlists.map(async (pl) => this.fetchItemLinks(pl)));

    return playlists;
  }

  async fetchItemLinks<T extends SpinitronItem>(item: T): Promise<T> {
    const result = item as T;

    const person = getItemOrArray(item._links.persona || item._links.personas || []);
    if (person.length > 0) {
      result.personas = await this.multipleCachedRequests(
        person.map((p) => p.href),
        PERSONA_TTL,
        true,
      );
    }

    const { show, self } = item._links;
    // @ts-expect-error
    if (show?.href) {
      result.show = await this.cachedRequest(
        // @ts-expect-error
        show.href.endsWith('view') ? self.href : show.href,
        SHOW_TTL,
        true,
      );
    }

    return result;
  }

  async multipleCachedRequests(paths: string[], ttl: number = 60, full: boolean = false) {
    return Promise.all(paths.map((pt) => this.cachedRequest(pt, ttl, full, true)));
  }

  /**
   * A wrapper around the request method that caches the result for a given amount of seconds.
   * @param path The path to the resource
   * @param ttl The maximum age of the cache in secs. If a cached resource is older, it's refetched.
   * @param isFullURL Whether the path is a full URL or not.
   * @param jittered Whether to jitter the request. Won't be added if the resource is cached.
   */
  async cachedRequest(
    path: string,
    ttl: number = 60,
    isFullURL: boolean = false,
    jittered: boolean = false,
  ) {
    const key = isFullURL ? path : `${this.rootURL}${path}`;
    const cachedValue = this.cacheMap.get(key);
    if (cachedValue && Date.now() - cachedValue.created < ttl) {
      return Promise.resolve(cachedValue.val);
    }

    if (jittered) await sleepRandom();
    return this.request(path, isFullURL).then((value) => {
      this.cacheMap.set(key, { val: value, created: Date.now() });
      return value;
    });
  }

  /**
   * Makes a request to the Spinitron proxy. It's its own method so we can
   * reuse our fetch-with-retries configuration.
   * @param path The path to the resource
   * @param isFullURL Whether the path is a full URL or not.
   */
  async request(path: string, isFullURL: boolean = true) {
    return fetchWithRetries(isFullURL ? path : `${this.rootURL}${path}`, {
      retryOptions: {
        maxRetries: 3,
        rateLimit: {
          maxDelay: 2000,
          maxRetries: 3,
        },
      },
    })
      .then(async (response) => {
        if (!response.ok && response.status !== 404) {
          const text = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}\n\nRequest: ${path}\nResponse: ${text}`);
        }
        return response.json().catch(() => null);
      })
      .catch((error) => console.error(error));
  }
}
