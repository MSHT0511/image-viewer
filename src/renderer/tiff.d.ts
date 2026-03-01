// Type definitions for tiff module
declare module 'tiff' {
  export interface TiffImage {
    width: number;
    height: number;
    data: ArrayBuffer;
  }

  export function decode(buffer: ArrayBuffer): TiffImage[];
}
