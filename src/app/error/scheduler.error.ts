import { ErrorLevel } from './error.constant';

export class SchedulerError extends Error {
  readonly errorCode: string;
  readonly errorLevel: ErrorLevel;
  readonly errorExtras?: any;

  constructor(errorCode: string, errorLevel: ErrorLevel = ErrorLevel.Normal, errorExtras?: any) {
    super(errorCode);
    this.errorCode = errorCode;
    this.errorLevel = errorLevel;
    this.errorExtras = errorExtras;
  }
}
