import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Campos obrigatorios do cadastro de vantagem (HU13). */
export class CreateVantagemDto {
  @Transform(aparar)
  @IsString({ message: 'Informe o nome da vantagem.' })
  @IsNotEmpty({ message: 'Informe o nome da vantagem.' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres.' })
  nome: string;

  @Transform(aparar)
  @IsString({ message: 'Informe a descrição.' })
  @IsNotEmpty({ message: 'Informe a descrição.' })
  @MaxLength(1000, {
    message: 'A descrição deve ter no máximo 1000 caracteres.',
  })
  descricao: string;

  @Transform(aparar)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Informe o endereço (URL) de uma imagem, começando com http.' },
  )
  @MaxLength(500, { message: 'A URL deve ter no máximo 500 caracteres.' })
  foto: string;

  @IsInt({ message: 'O custo deve ser um número inteiro.' })
  @Min(1, { message: 'O custo deve ser maior que zero.' })
  custo: number;
}
