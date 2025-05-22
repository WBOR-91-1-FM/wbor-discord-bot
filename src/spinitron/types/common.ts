import { makeSpinitronCleanDescription, makeSpinitronTimeslot } from '../utils';
import type { SpinitronShow } from './show';
import type { SpinitronPlaylist } from './playlist';
import type { SpinitronPersona } from './persona';

export interface SpinitronMultipleResultResponse<T> {
  items: T[];
}

interface SpinitronSingleLink {
  href: string;
}

type SpinitronLink = SpinitronSingleLink | SpinitronSingleLink[];

export interface SpinitronLinks {
  self: SpinitronLink;
  persona?: SpinitronLink;
  personas?: SpinitronLink;
  show?: SpinitronLink;
  spins?: SpinitronLink;
  playlist?: SpinitronLink;
}

export interface SpinitronItem {
  id: number;
  _links: SpinitronLinks;

  show?: SpinitronShow;
  playlist?: SpinitronPlaylist;
  personas?: SpinitronPersona[];

  timeslot?: string;
}

/**
 * Makes a SpinitronItem from a Record<string, any>. Also adds some common properties not exactly
 * present, such as start: Date, description: string, and end: Date.
 */
export function makeSpinitronItem(data: Record<string, any>): SpinitronItem {
  const result = data as SpinitronItem;

  // convert the dates
  if (data.start) {
    // @ts-expect-error
    result.start = new Date(data.start);
  }
  if (data.end) {
    // @ts-expect-error
    result.end = new Date(data.end);
  }

  if (data.start && data.end) {
    // @ts-expect-error
    result.timeslot = makeSpinitronTimeslot(data);
  }

  if (data.description) {
    // @ts-expect-error
    result.description = makeSpinitronCleanDescription(data.description);
  }

  return result;
}
