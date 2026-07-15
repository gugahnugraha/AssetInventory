declare module "qrcode" {
  export function toDataURL(
    text: string,
    options?: {
      margin?: number;
      width?: number;
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    }
  ): Promise<string>;
  
  const QRCode: {
    toDataURL(
      text: string,
      options?: {
        margin?: number;
        width?: number;
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
      }
    ): Promise<string>;
  };
  
  export default QRCode;
}
