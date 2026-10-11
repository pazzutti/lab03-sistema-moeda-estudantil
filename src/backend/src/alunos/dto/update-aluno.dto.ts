import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAlunoDto } from './create-aluno.dto.js';

/**
 * Login e CPF sao imutaveis (HU04): como o ValidationPipe rejeita campos
 * desconhecidos, envia-los no PATCH resulta em 400.
 */
export class UpdateAlunoDto extends PartialType(
  OmitType(CreateAlunoDto, ['login', 'cpf'] as const),
) {}
