import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { erroDeValidacao } from './common/erros.js';

/** Configuracao comum ao main.ts e aos testes e2e. */
export function configurarApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: erroDeValidacao,
    }),
  );
  // Aplica os @Exclude() das entidades (ex.: senha nunca vai na resposta).
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}
