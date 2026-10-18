import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaDto } from './create-empresa.dto.js';

/**
 * Login e CNPJ sao imutaveis: como o ValidationPipe rejeita campos
 * desconhecidos, envia-los no PATCH resulta em 400.
 */
export class UpdateEmpresaDto extends PartialType(
  OmitType(CreateEmpresaDto, ['login', 'cnpj'] as const),
) {}
