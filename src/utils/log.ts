const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const lvls = {
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
};

export interface LoggerOptions {
  level?: LogLevel;
  scope?: string;
}

function levelToASCII(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '\x1b[36m'; // cyan
    case LogLevel.INFO:
      return '\x1b[32m'; // green
    case LogLevel.WARN:
      return '\x1b[33m'; // yellow
    case LogLevel.ERROR:
      return '\x1b[31m'; // red
    default:
      return '\x1b[0m'; // reset
  }
}

export class Logger {
  constructor(
    public opts: LoggerOptions,
  ) {}

  // on(scope) returns a new logger with the same level but a different scope.
  // that is, currentScope + . + scope
  on(scope: string): Logger {
    return new Logger({
      level: this.opts.level,
      scope: this.opts.scope ? `${this.opts.scope}.${scope}` : scope,
    });
  }

  log(level: LogLevel, message: string): void {
    if (!this.#shouldPrint(level)) return;

    // date format is yyyy-mm-dd hh:mm:ssZ
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const date = timestamp.split(' ')[0]!.split('-').join('/');
    const time = timestamp.split(' ')[1]!.split(':').slice(0, 2).join(':');
    const formattedDate = `${date} ${time}`;

    const scope = this.opts.scope ? `[${this.opts.scope}]` : '';

    console.log(
      `${formattedDate} ${BOLD}${levelToASCII(level)}[${level}]${RESET} ${scope} ${message}`,
    );
  }

  #shouldPrint(level: LogLevel): boolean {
    const currentLevel = this.opts.level as LogLevel;
    if (!lvls[currentLevel]) {
      throw new Error(`Invalid log level: ${currentLevel}`);
    }

    const [currentLevelValue, levelValue] = [lvls[currentLevel], lvls[level]];
    return currentLevelValue <= levelValue;
  }

  debug(message: string) { this.log(LogLevel.DEBUG, message); }

  info(message: string) { this.log(LogLevel.INFO, message); }

  warn(message: string) { this.log(LogLevel.WARN, message); }

  error(message: string) { this.log(LogLevel.ERROR, message); }

  err(e: Error, message: string | undefined = undefined): void {
    if (message) {
      this.error(message);
      console.error(e.stack);
    }

    this.error(`An error was thrown: ${e.message}`);
    console.error(e.stack || '');
  }
}

export const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  scope: 'org.wbor.discord',
});
