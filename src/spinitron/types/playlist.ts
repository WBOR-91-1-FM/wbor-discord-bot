import { makeSpinitronItem, type SpinitronItem, type SpinitronMultipleResultResponse } from './common';
import type { SpinitronPersona } from './persona';
import type { SpinitronSpin } from './spin';

export interface SpinitronPlaylist extends SpinitronItem {
  persona_id: number;
  show_id: number | null;
  start: Date;
  end: Date;
  duration: number;
  timezone: string;
  category: string | null;
  title: string;
  description: string | null;
  since: string | null;
  url: string | null;
  hide_dj: boolean;
  image: string;
  automation: boolean;
  episode_name: string | null;
  episode_description: string | null;
  spinsCount: number;
}

type SpinitronPlaylistResponse = SpinitronMultipleResultResponse<SpinitronPlaylist>;

export function makeSpinitronPlaylist(data: SpinitronPlaylistResponse): SpinitronPlaylist[] {
  return data.items.map((r: Record<string, any>) => {
    const item = r;

    // convert them to actual booleans
    item.hide_dj = !!item.hide_dj;
    item.automation = !!item.automation;

    // convert them to actual numbers and dates
    item.spinsCount = parseInt(item.spinsCount, 10);

    return makeSpinitronItem(item) as SpinitronPlaylist;
  });
}
