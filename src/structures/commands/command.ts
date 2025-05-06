/*
 * What's expected from the command files that we load.
 */
import { SlashCommandBuilder } from 'discord.js';
import Context from './context';

export interface CommandInfo {
  name: string;
  description: string;
  private?: boolean;
  devOnly?: boolean;
  noDM?: boolean;

  // TODO: find a type that works here, currently there aren't any that are generic enough
  slashOptions?: (builder: SlashCommandBuilder) => any;

  // Array of conditions that must be met for the command to run.
  // Literal booleans will be checked during startup; if any are false, the command won't be loaded.
  dependsOn?: boolean[] | ((ctx: Context) => boolean)[];
}

export type CommandBody = (ctx: Context) => Promise<void>;

export interface ImportedCommand {
  default: CommandBody;
  info: CommandInfo;
}
