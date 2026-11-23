import QRCode from 'qrcode';

/**
 * QR Code do cupom (HU08), em PNG. Ele guarda so o codigo, que ja e unico
 * por resgate: a empresa le o QR em vez de digitar o codigo na troca.
 */
export function gerarQrCodeCupom(codigo: string): Promise<Buffer> {
  return QRCode.toBuffer(codigo, {
    type: 'png',
    // Nivel M: aguenta tela riscada ou com brilho sem deixar o QR denso.
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: { dark: '#312e81', light: '#ffffff' },
  });
}
