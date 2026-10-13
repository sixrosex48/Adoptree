import { NestFactory } from '@nestjs/core';
import { AppModule } from './app';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  return app;
}
