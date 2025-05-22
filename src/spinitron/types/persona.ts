import type { SpinitronItem } from './common';

export interface SpinitronPersona extends SpinitronItem {
  name: string;
  bio: string | null;
  since: number | null;
  image: string | null;
}
