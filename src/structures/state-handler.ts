/*
 * Basically tracks changes on the currently playing song and the current show,
 * and uses EventEmitter so the bot can react to these changes.
 */

import { EventEmitter } from 'node:events';
import { EventSource } from 'eventsource';
import type { NowPlayingData } from '../utils/wbor';
import {
  isShowFunctionalityAvailable,
  SSE_TRACK_FEED,
  STATION_ID,
} from '../constants';
import { logger } from '../utils/log';
import type { SpinitronPlaylist } from '../spinitron/types/playlist';
import type WBORClient from '../client';
import { makeSpinitronDJNames } from '../spinitron/utils';

const log = logger.on('states');

export default class StateHandler extends EventEmitter {
  currentTrack: NowPlayingData;

  currentShow: SpinitronPlaylist;

  constructor(public client: WBORClient) {
    super();

    this.currentTrack = null as unknown as NowPlayingData;
    this.currentShow = null as unknown as SpinitronPlaylist;
    this.#connectToTrackSSE();

    if (!isShowFunctionalityAvailable) {
      log.error(
        'SPINITRON_URL not set, show functionality will be unavailable.',
      );
    }
  }

  waitForTrack() {
    if (this.currentTrack) {
      return Promise.resolve(this.currentTrack);
    }

    return new Promise<NowPlayingData>((resolve) => {
      this.once('trackChange', resolve);
    });
  }

  waitForShow() {
    if (!isShowFunctionalityAvailable) return Promise.resolve(null);

    if (this.currentShow?.title) {
      return Promise.resolve(this.currentShow);
    }

    return new Promise<SpinitronPlaylist>((resolve) => {
      this.once('showChange', resolve);
    });
  }

  async #setUpShowTrack() {
    if (!isShowFunctionalityAvailable) return;

    const show = await this.client.spinitronClient.getCurrentShow();

    if (!show) {
      log.on('spinitron').error('Failed to fetch current show');
      return;
    }

    if (!this.#areShowsTheSame(show)) {
      log.on('spinitron').info(`WBOR is now airing ${show.title}, by ${makeSpinitronDJNames(show.personas)}`);
      this.currentShow = show;
      this.emit('showChange', show);
    }
  }

  #areShowsTheSame(show: SpinitronPlaylist) {
    if (!this.currentShow) return false;
    return (
      this.currentShow?.title === show.title
      || makeSpinitronDJNames(this.currentShow?.personas) === makeSpinitronDJNames(show.personas)
    );
  }

  #connectToTrackSSE() {
    const url = SSE_TRACK_FEED;

    const subs: Record<string, any> = {};
    subs[STATION_ID] = { recover: true };

    const data = new URLSearchParams({
      cf_connect: JSON.stringify({
        subs,
      }),
    });

    const fullUrl = `${url}?${data.toString()}`;
    const eventSource = new EventSource(fullUrl);
    this.#setUpSSEEvents(eventSource);
  }

  #setUpSSEEvents(es: EventSource) {
    es.addEventListener('message', async (data) => {
      const parsedData = JSON.parse(data.data);

      if (parsedData.connect) await this.#onSSEReady(parsedData);
      else if (parsedData.pub?.data?.np) await this.#onSSENewTrack(parsedData.pub.data);
    });

    es.addEventListener('error', (error: any) => {
      log.on('azuracast').err(error, 'Error in SSE connection');
    });
  }

  #onSSEReady(payload: Record<string, any>) {
    log.on('azuracast').debug(
      `Successfully connected using SSE. AzuraCast ${payload.connect.version}. ${payload.connect.ping}ms.`,
    );

    // same thing we'd get from the track payload.
    const trackPayload = payload.connect.subs[STATION_ID].publications[0].data;
    return this.#onSSENewTrack(trackPayload);
  }

  async #onSSENewTrack(payload: Record<string, any>) {
    const npPayload = payload.np as NowPlayingData;

    if (!this.#areTracksTheSame(npPayload)) {
      log.on('azuracast').info(
        `WBOR is now playing ${npPayload.now_playing.song.title}, by ${npPayload.now_playing.song.artist}`,
      );

      this.currentTrack = npPayload;

      // once track changes, we have to refetch the show (more specifically, the show's spins,
      // which will contain ISRC data so we can fetch the Spotify link).
      await this.#setUpShowTrack();

      this.emit('trackChange', npPayload);
    }
  }

  #areTracksTheSame(song: NowPlayingData) {
    if (!this.currentTrack) return false;
    return (
      this.currentTrack.now_playing.song.title
      === song.now_playing.song.title
      && this.currentTrack.now_playing.song.art === song.now_playing.song.art
    );
  }
}
