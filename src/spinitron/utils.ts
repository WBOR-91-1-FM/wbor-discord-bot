import type { SpinitronPersona } from './types/persona';

export function makeSpinitronDJNames(
  djs: SpinitronPersona | SpinitronPersona[] | null | undefined,
): string {
  if (Array.isArray(djs)) {
    return djs.map((dj) => dj.name).join(', ');
  }
  if (!djs) return 'Anonymous';
  return djs.name;
}

export function makeSpinitronTimeslot(
  { start, end }: { start: Date; end: Date },
): string {
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return `From ${startTime} to ${endTime} (ET)`;
}

export function makeSpinitronCleanDescription(
  description: string | null,
): string {
  if (!description) return 'No description available';
  return description.split('</p>')[0]!.replace(/<[^>]+>/g, '');
}

export function getItemOrArray<T>(
  item: T | T[],
): T[] {
  if (Array.isArray(item)) return item;
  return [item];
}
