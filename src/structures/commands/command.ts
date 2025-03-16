/*
 * What's expected from the command files that we load.
 */
import { Context } from "./context";

export interface CommandInfo {
  name: string;
  description: string;
  private?: boolean;
  devOnly?: boolean;
  noDM?: boolean;
}

export type CommandBody = (ctx: Context) => Promise<void>;

export interface ImportedCommand {
  default: CommandBody;
  info: CommandInfo;
}
