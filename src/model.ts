import { LogLevel, ModuleMetadata, Type } from '@nestjs/common';

export const PARAMS_PROVIDER_TOKEN = 'better-logger-config';

export type PreparedMessageArgs = {
  message: string;
  context: string;
  customFieldData: Record<string, string>;
  args: any[];
};

export type PreparedMetaInfo = {
  pid: number;
  timestamp: string;
};

export type BetterLoggerRequestMiddlewareConfig = {
  headers?: boolean;
  redactedHeaders?: string[];
  ignoredPaths?: string[];
};

export type BetterLoggerConfig = {
  json?: boolean;
  logLevel?: LogLevel[];
  requestMiddleware?: BetterLoggerRequestMiddlewareConfig | boolean;
  getCustomFields?: (req?: any, res?: any) => Record<string, string>;
};


export interface BetterLoggerOptionsFactory {
  createBetterLoggerOptions(): Promise<BetterLoggerConfig> | BetterLoggerConfig;
}

export interface BetterLoggerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<BetterLoggerOptionsFactory>;
  useClass?: Type<BetterLoggerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<BetterLoggerConfig> | BetterLoggerConfig;
  inject?: any[];
}
