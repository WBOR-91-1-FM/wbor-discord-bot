/*
 * What's expected from the command files that we load.
 */
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { Context } from "./context";

export interface CommandInfo {
  name: string;
  description: string;
  private?: boolean;
  devOnly?: boolean;
  noDM?: boolean;
  slashOptions?: (builder: SlashCommandBuilder) => any; // TODO: find a type that works here, currently there aren't any that are generic enough
}

export type CommandBody = (ctx: Context) => Promise<void>;

export interface ImportedCommand {
  default: CommandBody;
  info: CommandInfo;
}
