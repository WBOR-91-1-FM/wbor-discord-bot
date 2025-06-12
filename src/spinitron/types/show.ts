import { makeSpinitronItem, type SpinitronItem, type SpinitronMultipleResultResponse } from './common';
import { buildShowURL } from '../../constants';

export interface SpinitronShow extends SpinitronItem {
  show_id: number | null;
  title: string;
  start: Date;
  end: Date;
  url: string | null;
  description: string | null;
  image: string | null;
  category: string | null;
  since: number | null;
}

export function makeSpinitronShow(
  data: SpinitronMultipleResultResponse<SpinitronShow>,
): SpinitronShow[] {
  return data.items.map(makeSpinitronItem) as SpinitronShow[];
}

export function addMissingShowURLs(
  shows: SpinitronShow[],
) {
  return shows.map((show) => {
    if (!show.url?.length) {
      return { ...show, url: buildShowURL(show.id) };
    }
    return show;
  });
}
