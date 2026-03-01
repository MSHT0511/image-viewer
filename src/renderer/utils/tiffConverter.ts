import { decode } from 'tiff';

/**
 * Convert TIFF file to Data URL
 * @param filePath - Path to the TIFF file
 * @returns Data URL string
 */
export async function convertTiffToDataUrl(filePath: string): Promise<string> {
  try {
    // Read the file as ArrayBuffer
    const response = await fetch(`file:///${filePath.replace(/\\/g, '/')}`);
    const arrayBuffer = await response.arrayBuffer();

    // Decode TIFF
    const images = decode(arrayBuffer);

    if (!images || images.length === 0) {
      throw new Error('No images found in TIFF file');
    }

    // Use the first image (for multi-page TIFF)
    const image = images[0];

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create ImageData from TIFF data
    const imageData = ctx.createImageData(image.width, image.height);
    imageData.data.set(new Uint8ClampedArray(image.data));

    // Put image data on canvas
    ctx.putImageData(imageData, 0, 0);

    // Convert to Data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error converting TIFF:', error);
    throw new Error(`Failed to load TIFF image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
