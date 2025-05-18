import { makeSpinitronItem, type SpinitronItem, type SpinitronMultipleResultResponse } from './common.ts';

export interface SpinitronSpin extends SpinitronItem {
  playlist_id: number;
  start: Date;
  end: Date;
  duration: number;
  timezone: string;
  classical: boolean;
  artist: string;
  release: string;
  released: number;
  va: boolean;
  label: string;
  song: string;
  isrc: string;
  upc: string;
}

export const makeSpinitronSpins = (
  data: SpinitronMultipleResultResponse<SpinitronSpin>,
): SpinitronSpin[] => data.items.map(makeSpinitronItem) as SpinitronSpin[];
