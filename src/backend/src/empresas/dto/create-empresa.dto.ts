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

  @IsCnpj()
  cnpj: string;
}
