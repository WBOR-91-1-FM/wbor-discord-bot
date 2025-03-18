import { EMBED_COLOR, LOGO_URL, STATION_NAME } from "../constants.ts";
import { EmbedBuilder } from "discord.js";

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
