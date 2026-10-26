import {
  BadRequestException,
  ConflictException,
  ValidationError,
} from '@nestjs/common';

/**
 * Corpo padrao dos erros de validacao: "message" mantem o formato do Nest
 * (lista de textos) e "campos" associa cada mensagem ao campo do formulario,
 * para o frontend exibi-la ao lado do input correspondente.
 */
export type CamposComErro = Record<string, string>;

/** Usado como exceptionFactory do ValidationPipe global. */
export function erroDeValidacao(erros: ValidationError[]) {
  const campos: CamposComErro = {};
  for (const erro of erros) {
    const restricoes = erro.constraints ?? {};
    campos[erro.property] = restricoes.whitelistValidation
      ? 'Este campo não pode ser enviado.'
      : // Mostra so a primeira mensagem de cada campo, a mais relevante.
        Object.values(restricoes)[0];
  }
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: Object.values(campos),
    campos,
  });
}

/** 409 para dado unico ja cadastrado (login, email, CPF, CNPJ). */
export function conflito(campo: string, mensagem: string) {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: mensagem,
    campos: { [campo]: mensagem },
  });
}
