import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { IncomingWebhook } from '@slack/webhook';
import { JobType } from '../app.constant';
import { config } from '../config/config.service';

@Injectable()
export class SentryService {
  sendError(e: any, jobType: JobType) {
    Sentry.captureException(e);

    if (e instanceof Error) {
      this.send(jobType, e.message, e.stack);
    } else {
      this.send(jobType, 'unknown error', JSON.stringify(e));
    }
  }

  private send(jobType: JobType, title: string, value: string) {
    const webhook = new IncomingWebhook(config.slackApiServer);
    webhook.send({
      attachments: [
        {
          color: 'danger',
          text: `🚨${jobType} Job 버그 발생🚨`,
          fields: [
            {
              title,
              value,
              short: false,
            },
          ],
          ts: Math.floor(new Date().getTime() / 1000).toString(),
        },
      ],
    });
  }
}
