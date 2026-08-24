/* The qrcode package ships no types; only toDataURL is used. */
declare module 'qrcode' {
  export function toDataURL(
    text: string,
    options?: {
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      margin?: number;
      scale?: number;
      width?: number;
      color?: { dark?: string; light?: string };
    },
  ): Promise<string>;
}
