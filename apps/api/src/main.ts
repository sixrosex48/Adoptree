import { NestFactory } from '@nestjs/core';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');

  const webDist = join(__dirname, '../../web/dist');
  if (existsSync(join(webDist, 'index.html'))) {
    app.use(express.static(webDist));
    app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
      if (request.path.startsWith('/api')) return next();
      response.sendFile(join(webDist, 'index.html'));
    });
  }

  await app.listen(Number(process.env.PORT || 3000), '0.0.0.0');
}

bootstrap();
