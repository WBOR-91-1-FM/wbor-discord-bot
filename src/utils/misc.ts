import fs from 'fs';
import * as metadataFilter from '@web-scrobbler/metadata-filter';

/**
 * Pads a time value with leading zeros if needed
 * @param time The time value to pad
 * @returns Padded time string (always 2 digits)
 */
export function padTime(time: number): string {
  let t = time.toString();

  while (t.length < 2) {
    t = `0${t}`;
  }

  return t;
}

/**
 * Converts a Unix timestamp to a time string in the specified timezone
 * @param time Unix timestamp in seconds
 * @param timezone The timezone to convert to (default: "America/New_York")
 * @returns Formatted time string in HH:MM format
 */
export function unixConvert(
  time: number,
  timezone: string = 'America/New_York',
): string {
  const convertedTime = new Date(time * 1000).toLocaleString('en-US', {
    timeZone: timezone,
  });

  const dateObj = new Date(convertedTime);
  return `${padTime(dateObj.getHours())}:${padTime(dateObj.getMinutes())}`;
}

/**
 * Logs an error to a file if LOG_PATH is set, and to the console
 * @param time The timestamp of the error
 * @param content The error content to log
 */
export function logError(time: Date, content: string | Error): void {
  // Convert Error objects to string if needed
  const errorContent = content instanceof Error ? `${content.message}\n${content.stack}` : content;

  if (process.env.LOG_PATH) {
    fs.appendFile(
      process.env.LOG_PATH,
      `\n\n===============================================\n${time.toString()}\n${errorContent}`,
      (err) => {
        if (err) console.error(err);
      },
    );
  }

  console.error(errorContent);
}

const filterSet = {
  track: [
    metadataFilter.removeLive,
    metadataFilter.removeParody,
    metadataFilter.removeVersion,
    metadataFilter.removeRemastered,
    metadataFilter.removeZeroWidth,
    metadataFilter.removeCleanExplicit,
    metadataFilter.removeReissue,
    metadataFilter.removeFeature,
    metadataFilter.fixTrackSuffix,
  ],
};

const filter = metadataFilter.createFilter(filterSet);

/**
 * Cleans up track titles using web-scrobbler/metadata-filter. Used on presence updates.
 * @param title The title to clean up
 * @returns Cleaned up title
 */
export function cleanTrackTitle(title: string): string {
  return filter.filterField('track', title);
}
