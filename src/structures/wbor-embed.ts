import { EmbedBuilder } from 'discord.js';
import { EMBED_COLOR, LOGO_URL, STATION_NAME } from '../constants';

export default class WBOREmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(EMBED_COLOR);
    this.setTimestamp();
    this.setAuthor({
      name: STATION_NAME,
      iconURL: LOGO_URL,
    });
  }
}
