import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/** Dados do envio de moedas (HU09). */
export class EnviarMoedasDto {
  @IsInt({ message: 'Selecione o aluno.' })
  alunoId: number;

  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior que zero.' })
  quantidade: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Informe o motivo.' })
  @IsNotEmpty({ message: 'Informe o motivo.' })
  motivo: string;
}
