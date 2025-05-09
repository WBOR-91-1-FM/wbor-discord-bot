import * as cheerio from 'cheerio';
import { SPINITRON_URL, STATION_NAME } from '../constants';
import {
  CURRENT_SHOW_DATE_SELECTOR,
  CURRENT_SHOW_HOST_SELECTOR,
  CURRENT_SHOW_GENRE_SELECTOR,
  CURRENT_SHOW_IMAGE_SELECTOR,
  CURRENT_SHOW_TITLE_SELECTOR,
  CURRENT_SHOW_DESCRIPTION_SELECTOR,
  UPCOMING_SHOWS_TABLE_SELECTOR,
} from './selectors';
import type { SpinitronShow, SpinitronUpcomingShow } from './types';

export const cleanSpinitronHost = () => new URL(SPINITRON_URL!).hostname;

export const getPage = () => fetch(SPINITRON_URL!).then((a) => a.text());

export const parsePage = (html: string): SpinitronShow => {
  const $ = cheerio.load(html);
  const currentShowDate = $(CURRENT_SHOW_DATE_SELECTOR).text().trim();
  const currentShowHost = $(CURRENT_SHOW_HOST_SELECTOR).text().trim();
  const currentShowGenre = $(CURRENT_SHOW_GENRE_SELECTOR).text().trim();
  const currentShowImage = $(CURRENT_SHOW_IMAGE_SELECTOR).attr('src');
  const currentShowTitle = $(CURRENT_SHOW_TITLE_SELECTOR).text().trim();
  const currentShowDescription = $(CURRENT_SHOW_DESCRIPTION_SELECTOR)
    .text()
    .trim();

  const shows: SpinitronUpcomingShow[] = [];
  $(UPCOMING_SHOWS_TABLE_SELECTOR).each((index, el) => {
    const $row = $(el);

    const showTime = $row.find('.show-time').text().trim();
    const showName = $row.find('strong a').text().trim();
    const djNames: string[] = [];
    // Get all links that appear after the strong tag (show title)
    $row.find('td:nth-child(2) a').each(() => {
      // Skip show links (which are inside a strong tag)
      if (!$(this).closest('strong').length) {
        djNames.push($(this).text().trim());
      }
    });

    // the genre might not be present, so we use a regex to see if it's there
    let genre: string | null = null;
    const secondTdText = $row.find('td:nth-child(2)').text();
    const genreMatch = secondTdText.match(/\(([^)]+)\)/);
    if (genreMatch && genreMatch[1]) {
      genre = genreMatch[1].trim();
    }

    shows.push({
      timeslot: showTime,
      title: showName,
      host: djNames.join(', '),
      genre,
      // when the automation playlist's on, the title will start with WBOR 91.1 FM.
      isAutomationBear: showName.startsWith(STATION_NAME),
    });
  });

  return {
    title: currentShowTitle,
    description: currentShowDescription || 'No description available.',
    timeslot: currentShowDate,
    isAutomationBear: currentShowTitle.startsWith(STATION_NAME),
    upcomingShows: shows,
    host: currentShowHost || null,
    genre: currentShowGenre || null,
    image: currentShowImage?.startsWith('/')
      ? `https://${cleanSpinitronHost()}${currentShowImage}`
      : currentShowImage || null,
  };
};

export const getCurrentShow = async () => {
  const html = await getPage();
  return parsePage(html);
};
