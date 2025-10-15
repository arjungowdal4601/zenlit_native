import * as ImageManipulator from 'expo-image-manipulator';

const MAX_SIZE_KB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

async function getImageSize(uri: string): Promise<number> {
  if (typeof window !== 'undefined' && uri.startsWith('blob:')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  }
  return 0;
}

export async function compressImage(uri: string): Promise<CompressedImage> {
  try {
    if (uri.startsWith('data:')) {
      const base64Match = uri.match(/^data:(.*?);base64,(.+)$/);
      if (base64Match && base64Match[2]) {
        return {
          uri,
          width: 0,
          height: 0,
          base64: base64Match[2],
        };
      }
      throw new Error('Invalid data URI supplied for image compression');
    }

    let quality = 0.9;
    let currentUri = uri;
    let currentSize = await getImageSize(uri);

    if (currentSize === 0 || currentSize <= MAX_SIZE_BYTES) {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      return result;
    }

    while (currentSize > MAX_SIZE_BYTES && quality > 0.3) {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      currentUri = result.uri;
      currentSize = await getImageSize(result.uri);

      if (currentSize <= MAX_SIZE_BYTES) {
        return result;
      }

      quality -= 0.1;
    }

    if (currentSize > MAX_SIZE_BYTES) {
      const maxDimension = 1920;
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxDimension } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      currentUri = result.uri;
      currentSize = await getImageSize(result.uri);

      if (currentSize > MAX_SIZE_BYTES) {
        const smallerDimension = 1280;
        return await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: smallerDimension } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
      }

      return result;
    }

    const finalResult = await ImageManipulator.manipulateAsync(
      currentUri,
      [],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    return finalResult;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}
