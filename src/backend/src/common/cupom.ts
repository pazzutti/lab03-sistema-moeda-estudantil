import { randomInt } from 'node:crypto';

/** Sem 0/O, 1/I/L e 5/S: o codigo e lido em voz alta na troca presencial. */
const ALFABETO = '2346789ABCDEFGHJKMNPQRTUVWXYZ';
const TAMANHO_DO_GRUPO = 4;

/**
 * Codigo do cupom de resgate (HU08/HU15), no formato "XXXX-XXXX". O sorteio
 * usa o gerador criptografico: a empresa entrega a vantagem a quem apresentar
 * o codigo, entao ele nao pode ser adivinhado a partir dos anteriores.
 */
export function gerarCodigoCupom(): string {
  const grupo = () =>
    Array.from(
      { length: TAMANHO_DO_GRUPO },
      () => ALFABETO[randomInt(ALFABETO.length)],
    ).join('');
  return `${grupo()}-${grupo()}`;
}
