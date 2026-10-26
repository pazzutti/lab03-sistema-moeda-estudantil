import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsCnpj } from '../../common/cnpj.js';

/** Campos obrigatorios do cadastro de empresa parceira. */
export class CreateEmpresaDto {
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

  @IsString({ message: 'Informe o nome da empresa.' })
  @IsNotEmpty({ message: 'Informe o nome da empresa.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  nome: string;

  @IsCnpj()
  cnpj: string;
}
