import { makeSpinitronItem, type SpinitronItem, type SpinitronMultipleResultResponse } from './common.ts';

export interface SpinitronShow extends SpinitronItem {
  title: string;
  start: Date;
  end: Date;
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
