/** Moedas que cada professor recebe por semestre (HU16). */
export const CREDITO_SEMESTRAL = 1000;

/** Dias do inicio do mes em que a recarga semestral pode acontecer. */
const DIAS_DA_RECARGA = 7;
const FEVEREIRO = 1;
const AGOSTO = 7;

/**
 * Semestre a recarregar na data: so ha valor na primeira semana de fevereiro
 * e na de agosto (HU16).
 */
export function semestreDaRecarga(data: Date): string | null {
  if (data.getDate() > DIAS_DA_RECARGA) {
    return null;
  }
  if (data.getMonth() === FEVEREIRO) {
    return `${data.getFullYear()}.1`;
  }
  return data.getMonth() === AGOSTO ? `${data.getFullYear()}.2` : null;
}

/** Janeiro ainda pertence ao segundo semestre do ano anterior. */
export function semestreAtual(data: Date): string {
  const ano = data.getFullYear();
  if (data.getMonth() < FEVEREIRO) {
    return `${ano - 1}.2`;
  }
  return `${ano}.${data.getMonth() < AGOSTO ? 1 : 2}`;
}
