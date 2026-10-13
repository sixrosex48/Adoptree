import type { Request, Response } from 'express';
import { createApp } from './server';

const appPromise = createApp().then(async (app) => {
  await app.init();
  return app;
});

export default async function handler(request: Request, response: Response): Promise<void> {
  const app = await appPromise;
  app.getHttpAdapter().getInstance()(request, response);
}
