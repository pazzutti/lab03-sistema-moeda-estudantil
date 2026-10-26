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
  @IsString({ message: 'Informe o login.' })
  @IsNotEmpty({ message: 'Informe o login.' })
  @MaxLength(60, { message: 'O login deve ter no máximo 60 caracteres.' })
  login: string;

  @IsString({ message: 'Informe a senha.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  senha: string;

  @IsEmail({}, { message: 'Informe um email válido.' })
  @MaxLength(120, { message: 'O email deve ter no máximo 120 caracteres.' })
  email: string;

  @IsString({ message: 'Informe o nome.' })
  @IsNotEmpty({ message: 'Informe o nome.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  nome: string;

  @IsCpf()
  cpf: string;

  @IsString({ message: 'Informe o RG.' })
  @IsNotEmpty({ message: 'Informe o RG.' })
  @MaxLength(20, { message: 'O RG deve ter no máximo 20 caracteres.' })
  rg: string;

  @IsString({ message: 'Informe o endereço.' })
  @IsNotEmpty({ message: 'Informe o endereço.' })
  @MaxLength(255, {
    message: 'O endereço deve ter no máximo 255 caracteres.',
  })
  endereco: string;

  @IsString({ message: 'Informe o curso.' })
  @IsNotEmpty({ message: 'Informe o curso.' })
  @MaxLength(120, { message: 'O curso deve ter no máximo 120 caracteres.' })
  curso: string;

  /** Uma das instituicoes pre-cadastradas (GET /instituicoes). */
  @IsInt({ message: 'Selecione a instituição de ensino.' })
  instituicaoId: number;
}
