/// Will select the show that's currently on air. If it's the auto playlist,
// the title will begin with WBOR 91.1 FM.
export const CURRENT_SHOW_TITLE_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.data > h3 > a';

/// Will return the image URL of the currently playing show.
export const CURRENT_SHOW_IMAGE_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.image > img';

/// Will return the description of the currently playing show.
export const CURRENT_SHOW_DESCRIPTION_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.data > div > p';

/// Will return the host of the currently playing show.
// WBOR's Commodore 64 for the automation playlist.
export const CURRENT_SHOW_HOST_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.data > p.dj-name > a';

/// Will return the genre of the currently playing show.
export const CURRENT_SHOW_GENRE_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.data > p.show-categoty';

/// Will return the date of the currently playing show.
export const CURRENT_SHOW_DATE_SELECTOR = 'body > div > div.main-container > div > div.view-page > div.onair > div > div.data > p.timeslot';

/// Will return a table that contains the upcoming shows and at what time they will be airing.
export const UPCOMING_SHOWS_TABLE_SELECTOR = '#w1 > table > tbody tr';
