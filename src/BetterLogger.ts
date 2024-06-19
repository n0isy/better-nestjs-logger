import { ConsoleLogger, ConsoleLoggerOptions, Inject, LogLevel, Optional } from '@nestjs/common';
import { configure } from 'safe-stable-stringify';
import {
  BetterLoggerConfig,
  PARAMS_PROVIDER_TOKEN,
  PreparedMessageArgs,
  PreparedMetaInfo,
} from './model';

const DEFAULT_LOG_LEVELS: LogLevel[] = [
  'log',
  'error',
  'warn',
  'debug',
  'verbose',
  'fatal',
];

const severityToLevel: Map<LogLevel, number> = new Map([
  ['fatal', 0], // Emergency
  ['error', 3], // Error
  ['warn', 4], // Warning
  ['log', 6], // Informational
  ['debug', 7], // Debug
  ['verbose', 7], // Debug
]);

const safeStringify = configure({ deterministic: false });

export class BetterLogger extends ConsoleLogger {
  private readonly outputAsJson;
  private readonly logLevels: LogLevel[];
  private readonly getCustomFields;

  constructor(
    @Optional() context?: string,
    @Optional() consoleOptions: ConsoleLoggerOptions = {},
    @Inject(PARAMS_PROVIDER_TOKEN) options?: BetterLoggerConfig,
  ) {
    super(context ?? "", consoleOptions);

    this.outputAsJson = options?.json ?? false;
    this.getCustomFields = options?.getCustomFields;
    this.logLevels = options?.logLevel ?? DEFAULT_LOG_LEVELS;
  }

  error(...args: any[]) {
    if (!this.isLogLevelEnabled('error')) {
      return;
    }
    const finalArgs = this.prepareArgs(args);
    super.error(finalArgs);
  }

  warn(...args: any[]) {
    if (!this.isLogLevelEnabled('warn')) {
      return;
    }
    const finalArgs = this.prepareArgs(args);
    super.warn(finalArgs);
  }

  log(...args: any[]) {
    if (!this.isLogLevelEnabled('log')) {
      return;
    }
    const finalArgs = this.prepareArgs(args);
    super.log(finalArgs);
  }

  debug(...args: any[]) {
    if (!this.isLogLevelEnabled('debug')) {
      return;
    }
    const finalArgs = this.prepareArgs(args);
    super.debug(finalArgs);
  }

  verbose(...args: any[]) {
    if (!this.isLogLevelEnabled('verbose')) {
      return;
    }
    const finalArgs = this.prepareArgs(args);
    super.verbose(finalArgs);
  }

  private isLogLevelEnabled(level: LogLevel) {
    return this.logLevels.includes(level);
  }

  private prepareArgs(args: any[] = []): PreparedMessageArgs {
    const context = args.pop();
    const message = args.shift();
    const customFieldData = this.getCustomFieldData();

    return {
      message,
      context,
      customFieldData,
      args,
    };
  }

  private prepareMetaInfo(): PreparedMetaInfo {
    return {
      pid: process.pid,
      timestamp: new Date().toISOString()
    };
  }

  formatMessageJson(
    logLevel: LogLevel,
    message: PreparedMessageArgs,
    metaInfo: PreparedMetaInfo,
  ) {
    const payload = message.args.reduce(
      (accumulator, value, index) => ({
        ...accumulator,
        [`arg${index}`]: value,
      }),
      {},
    );

    return `${safeStringify({
      severity: logLevel,
      level: severityToLevel.get(logLevel),
      message: message.message,
      payload: payload,
      context: message.context,
      pid: metaInfo.pid,
      timestamp: metaInfo.timestamp,
      ...message.customFieldData,
    })}\n`;
  }

  private getCustomFieldData() {
    try {
      if (this.getCustomFields) {
        const data = this.getCustomFields();
        if (!data) {
          return {};
        }
        return data;
      }
    } catch (error) {
      console.error('Error getting trace context', error);
    }
    return {};
  }

  formatMessageString(
    logLevel: LogLevel,
    message: PreparedMessageArgs,
    metaInfo: PreparedMetaInfo,
  ) {
    const contextMessage = this.formatContext(message.context);
    const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
    const pidMessage = this.formatPid(metaInfo.pid);
    const timestampDiff = this.updateAndGetTimestampDiff();

    const stringMessage = String(
      [
        message.message || '',
        message.args && message.args.length > 0
          ? message.args.map(arg => safeStringify(arg))
          : '',
        Object.keys(message.customFieldData).length > 0
          ? safeStringify(message.customFieldData)
          : '',
      ]
        .flat()
        .map((s) => String(s).trim())
        .filter(Boolean)
        .join(' '),
    ).trim();

    return this.formatMessage(
      logLevel,
      stringMessage,
      pidMessage,
      formattedLogLevel,
      contextMessage,
      timestampDiff,
    );
  }

  protected async printMessages(
    messages: PreparedMessageArgs[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType: 'stdout' | 'stderr' = 'stdout',
  ) {
    messages.forEach((message) => {
      const metaInfo = this.prepareMetaInfo();
      const formattedMessage = this.outputAsJson
        ? this.formatMessageJson(logLevel, message, metaInfo)
        : this.formatMessageString(logLevel, message, metaInfo);

      process[writeStreamType].write(formattedMessage);
    });
  }
}
