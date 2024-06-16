import { Inject, Module, Optional } from '@nestjs/common';
import { DynamicModule, MiddlewareConsumer, NestModule, Provider } from '@nestjs/common/interfaces';
import { BetterLogger } from './BetterLogger';
import { RequestLoggerMiddleware } from './RequestLoggerMiddleware';
import {
  BetterLoggerAsyncOptions,
  BetterLoggerConfig,
  BetterLoggerOptionsFactory,
  PARAMS_PROVIDER_TOKEN
} from './model';

@Module({})
export class BetterLoggerModule implements NestModule {
  constructor(
    @Optional() @Inject(PARAMS_PROVIDER_TOKEN) private readonly config?: BetterLoggerConfig,
  ) {}

  static forRoot(options?: BetterLoggerConfig): DynamicModule {
    return {
      module: BetterLoggerModule,
      providers: [
        {
          provide: PARAMS_PROVIDER_TOKEN,
          useValue: options,
        },
        BetterLogger,
      ],
      exports: [BetterLogger],
    };
  }

  static forRootAsync(options: BetterLoggerAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: BetterLoggerModule,
      imports: options.imports || [],
      providers: [
        ...asyncProviders,
        BetterLogger,
      ],
      exports: [BetterLogger],
    };
  }

  private static createAsyncProviders(options: BetterLoggerAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: PARAMS_PROVIDER_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    const useClass = options.useClass || options.useExisting;
    if (!useClass) {
      throw new Error('Invalid configuration. Must provide useClass or useExisting');
    }

    return [
      {
        provide: PARAMS_PROVIDER_TOKEN,
        useFactory: async (optionsFactory: BetterLoggerOptionsFactory) =>
          await optionsFactory.createBetterLoggerOptions(),
        inject: [useClass],
      },
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  configure(consumer: MiddlewareConsumer) {
    if (this.config?.requestMiddleware) {
      consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
  }
}
