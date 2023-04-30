import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format, createLogger, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config.service';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly needConsole: boolean = config.useConsoleScheduler;

  private readonly rotateLoggerFormat;
  private readonly rotateOptions;

  private readonly rotateLogger: winston.Logger;
  private readonly rotateErrorLogger: winston.Logger;
  private readonly stdoutLogger: winston.Logger;

  constructor() {
    super();

    this.rotateLoggerFormat = format.combine(format.label({ label: config.projectName }), format.timestamp(), format.json());
    this.rotateOptions = {
      datePattern: 'YYYY-MM-DD',
      maxFiles: '5d',
      maxSize: '100m',
      utc: true,
    };

    this.rotateLogger = createLogger({
      level: 'info',
      format: this.rotateLoggerFormat,
      transports: [
        new DailyRotateFile({
          level: 'info',
          filename: `./logs/%DATE%/${config.projectName}.log`,
          ...this.rotateOptions,
        }),
      ],
    });

    this.rotateErrorLogger = createLogger({
      level: 'error',
      format: this.rotateLoggerFormat,
      transports: [
        new DailyRotateFile({
          level: 'error',
          filename: `./logs/%DATE%/${config.projectName}-error.log`,
          ...this.rotateOptions,
        }),
      ],
    });

    this.stdoutLogger = createLogger({
      format: format.simple(),
      transports: [new transports.Console()],
    });
  }

  getFileLogger(isError: boolean): winston.Logger {
    return isError ? this.rotateErrorLogger : this.rotateLogger;
  }

  getConsoleLogger(): winston.Logger {
    return this.stdoutLogger;
  }

  log(message: string, jobName: string, meta?: unknown): void {
    this.getFileLogger(false).info(`[${jobName}] ${message}`, meta);
    if (this.needConsole) {
      this.getConsoleLogger().info(`[${jobName}] ${message}`, meta);
    }
  }
  warn(message: string, jobName: string, meta?: unknown): void {
    this.getFileLogger(false).warn(`[${jobName}] ${message}`, meta);
    if (this.needConsole) {
      this.getConsoleLogger().warn(`[${jobName}] ${message}`, meta);
    }
  }
  debug(message: string, jobName: string, meta?: unknown): void {
    this.getFileLogger(false).info(`[${jobName}] ${message}`, meta);
    if (this.needConsole) {
      this.getConsoleLogger().info(`[${jobName}] ${message}`, meta);
    }
  }
  verbose(message: string, jobName: string, meta?: unknown): void {
    this.getFileLogger(false).info(`[${jobName}] ${message}`, meta);
    if (this.needConsole) {
      this.getConsoleLogger().info(`[${jobName}] ${message}`, meta);
    }
  }
  error(message: string, jobName: string, meta?: unknown): void {
    this.getFileLogger(true).error(`[${jobName}] ${message}`, meta);
    if (this.needConsole) {
      this.getConsoleLogger().error(`[${jobName}] ${message}`, meta);
    }
  }
}
