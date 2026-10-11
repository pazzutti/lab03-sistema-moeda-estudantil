import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  configurarApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
