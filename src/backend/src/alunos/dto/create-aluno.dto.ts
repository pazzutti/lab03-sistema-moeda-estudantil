import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsCpf } from '../../common/cpf.js';

/** Campos obrigatorios do cadastro de aluno (HU03). */
export class CreateAlunoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  login: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  senha: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsCpf()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  rg: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  endereco: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  curso: string;

  /** Uma das instituicoes pre-cadastradas (GET /instituicoes). */
  @IsInt()
  instituicaoId: number;
}
