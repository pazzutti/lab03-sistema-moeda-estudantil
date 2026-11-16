import { IsInt } from 'class-validator';

/** Vantagem que o aluno quer trocar por moedas (HU08). */
export class ResgatarVantagemDto {
  @IsInt({ message: 'Selecione a vantagem.' })
  vantagemId: number;
}
