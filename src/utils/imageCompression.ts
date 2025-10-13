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
    let quality = 0.9;
    let currentUri = uri;
    let currentSize = await getImageSize(uri);

    if (currentSize === 0 || currentSize <= MAX_SIZE_BYTES) {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result;
    }

    while (currentSize > MAX_SIZE_BYTES && quality > 0.3) {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
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
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      currentUri = result.uri;
      currentSize = await getImageSize(result.uri);

      if (currentSize > MAX_SIZE_BYTES) {
        const smallerDimension = 1280;
        return await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: smallerDimension } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
      }

      return result;
    }

    const finalResult = await ImageManipulator.manipulateAsync(
      currentUri,
      [],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    return finalResult;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}
