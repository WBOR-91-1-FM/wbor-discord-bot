import type { ColorResolvable } from 'discord.js';

export const WBOR_API_URL = process.env.AZURACAST_API_URL || 'https://azura.wbor.org/api/station/2';

export const EMBED_COLOR = (process.env.EMBED_HEX_COLOR as ColorResolvable) || '#22252f';

export const LOGO_URL = process.env.STATION_LOGO_URL
  || 'https://wbor.org/assets/images/apple-touch-icon.png';

export const SSE_TRACK_FEED = process.env.AZURACAST_SSE_URL
  || 'https://azura.wbor.org/api/live/nowplaying/sse';

// No defaults because this can be disabled
export const { SPINITRON_URL } = process.env;

// The station ID for AzuraCast
export const STATION_ID = process.env.AZURACAST_STATION_ID || 'station:wbor';

export const STATION_CALL_SIGN = process.env.STATION_CALL_SIGN || 'WBOR';

export const STATION_NAME = process.env.STATION_NAME || 'WBOR 91.1 FM';

// Utilities
// True if the Spinitron URL is set
export const isShowFunctionalityAvailable = !!process.env.SPINITRON_URL;
