import * as ImageManipulator from 'expo-image-manipulator';

const DEFAULT_MAX_SIZE_KB = 550;
const QUALITY_STEP = 0.08;
const MIN_QUALITY = 0.35;
const FALLBACK_MIN_QUALITY = 0.2;
const RESIZE_STEP = 0.9;
const DEFAULT_MIN_RESIZE_WIDTH = 720;
const ABSOLUTE_MIN_RESIZE_WIDTH = 480;

export const MAX_IMAGE_SIZE_BYTES = DEFAULT_MAX_SIZE_KB * 1024;

export interface CompressionMetadata {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  iterations: number;
  quality: number;
  resized: boolean;
  targetBytes: number;
}

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  mimeType: 'image/jpeg';
  metadata: CompressionMetadata;
  cleanup: () => void;
}

export interface CompressedImage extends PreparedImage {
  uri: string;
}

export interface ImageCompressionOptions {
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
  minResizeWidth?: number;
}

export interface CameraCapturePreparationOptions extends ImageCompressionOptions {
  width: number;
  height: number;
  quality?: number;
}

const isBlobUri = (value: string) => value.startsWith('blob:');

const revokeBlobUri = (uri: string) => {
  if (!isBlobUri(uri) || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return;
  }

  URL.revokeObjectURL(uri);
};

const fetchBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  if ('ok' in response && !response.ok) {
    throw new Error('Failed to read image data');
  }

  return response.blob();
};

const JPEG_DATA_URI_PREFIX = /^data:image\/(?:jpeg|jpg);base64,/i;

const isJpegBlob = (blob: Blob) =>
  blob.type.toLowerCase() === 'image/jpeg' || blob.type.toLowerCase() === 'image/jpg';

const hasJpegSignature = (bytes: Uint8Array) =>
  bytes.length >= 4 &&
  bytes[0] === 0xff &&
  bytes[1] === 0xd8 &&
  bytes[2] === 0xff &&
  bytes[bytes.length - 2] === 0xff &&
  bytes[bytes.length - 1] === 0xd9;

const readBlobBytes = async (blob: Blob): Promise<Uint8Array> => {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  if (typeof FileReader === 'undefined') {
    throw new Error('This device cannot read the camera capture');
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read camera capture'));
    reader.readAsArrayBuffer(blob);
  });
};

const decodeCameraJpegDataUri = (uri: string): Blob => {
  const prefix = uri.match(JPEG_DATA_URI_PREFIX)?.[0];
  if (!prefix) {
    throw new Error('Camera capture was not a JPEG data URI');
  }

  if (typeof globalThis.atob !== 'function') {
    throw new Error('This device cannot decode the camera capture');
  }

  let binary: string;
  try {
    binary = globalThis.atob(uri.slice(prefix.length));
  } catch {
    throw new Error('Camera capture contained invalid JPEG data');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  if (!hasJpegSignature(bytes)) {
    throw new Error('Camera capture did not contain a valid JPEG');
  }

  return new Blob([bytes], { type: 'image/jpeg' });
};

const clampQuality = (value: number, min: number) => Math.max(Math.min(value, 1), min);

/**
 * Converts an Expo image URI into a compressed JPEG Blob.
 *
 * Gallery images, native file URIs, and oversized web camera captures pass
 * through ImageManipulator, become a binary JPEG Blob, and are never persisted
 * as Base64. Normal Expo web camera data URIs use prepareCameraCapture instead.
 */
export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {},
): Promise<CompressedImage> {
  const targetBytes = options.maxBytes ?? MAX_IMAGE_SIZE_BYTES;
  const minQuality = options.minQuality ?? MIN_QUALITY;
  const minResizeWidth = options.minResizeWidth ?? DEFAULT_MIN_RESIZE_WIDTH;
  const initialQuality = clampQuality(options.initialQuality ?? 0.92, minQuality);

  let originalSize = 0;
  try {
    originalSize = (await fetchBlob(uri)).size;
  } catch {
    // ImageManipulator may still be able to read a native file URI. In that
    // case, use the final JPEG size as the original-size fallback.
  }

  let quality = initialQuality;
  let iterations = 0;
  let resized = false;
  let currentResultUri: string | null = null;

  const performManipulation = async (
    resizeWidth?: number,
    forcedQuality?: number,
  ): Promise<{ result: ImageManipulator.ImageResult; blob: Blob }> => {
    const actions = resizeWidth ? [{ resize: { width: resizeWidth } }] : [];
    const previousResultUri = currentResultUri;
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: clampQuality(forcedQuality ?? quality, FALLBACK_MIN_QUALITY),
      format: ImageManipulator.SaveFormat.JPEG,
      base64: false,
    });
    const blob = await fetchBlob(result.uri);
    if (!isJpegBlob(blob)) {
      throw new Error(`Image conversion returned ${blob.type || 'an unknown format'} instead of JPEG`);
    }

    if (previousResultUri && previousResultUri !== result.uri && previousResultUri !== uri) {
      revokeBlobUri(previousResultUri);
    }

    currentResultUri = result.uri;
    return { result, blob };
  };

  try {
    let manipulated = await performManipulation();
    let result = manipulated.result;
    let size = manipulated.blob.size;

    while (size > targetBytes && quality > minQuality + 0.001) {
      iterations += 1;
      quality = clampQuality(quality - QUALITY_STEP, minQuality);
      manipulated = await performManipulation(undefined, quality);
      result = manipulated.result;
      size = manipulated.blob.size;
    }

    if (size > targetBytes) {
      resized = true;
      let currentWidth = result.width;
      let guard = 0;

      while (size > targetBytes && guard < 12) {
        guard += 1;
        iterations += 1;

        const nextWidthCandidate = Math.floor(currentWidth * RESIZE_STEP);
        const nextWidth = Math.max(
          nextWidthCandidate < currentWidth ? nextWidthCandidate : currentWidth - 40,
          Math.min(minResizeWidth, currentWidth),
          ABSOLUTE_MIN_RESIZE_WIDTH,
          320,
        );

        if (nextWidth >= currentWidth) {
          break;
        }

        currentWidth = nextWidth;
        manipulated = await performManipulation(currentWidth, quality);
        result = manipulated.result;
        size = manipulated.blob.size;
      }

      while (size > targetBytes && quality > FALLBACK_MIN_QUALITY + 0.001) {
        iterations += 1;
        quality = clampQuality(quality - QUALITY_STEP, FALLBACK_MIN_QUALITY);
        manipulated = await performManipulation(currentWidth, quality);
        result = manipulated.result;
        size = manipulated.blob.size;
      }
    }

    if (!currentResultUri) {
      throw new Error('Image compression did not produce a JPEG');
    }

    const blob = manipulated.blob;
    const resultUri = currentResultUri;
    const finalSize = blob.size;
    const measuredOriginalSize = originalSize > 0 ? originalSize : finalSize;
    let cleanedUp = false;

    return {
      uri: resultUri,
      blob,
      width: result.width,
      height: result.height,
      size: finalSize,
      mimeType: 'image/jpeg',
      metadata: {
        originalSize: measuredOriginalSize,
        compressedSize: finalSize,
        compressionRatio: measuredOriginalSize > 0 ? finalSize / measuredOriginalSize : 1,
        iterations,
        quality,
        resized,
        targetBytes,
      },
      cleanup: () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (resultUri !== uri) {
          revokeBlobUri(resultUri);
        }
      },
    };
  } catch (error) {
    if (currentResultUri && currentResultUri !== uri) {
      revokeBlobUri(currentResultUri);
    }
    throw error;
  }
}

/**
 * Expo Camera encodes web captures as JPEG data URIs or temporary Blob URLs.
 * Read either result directly into validated binary instead of sending it
 * through ImageManipulator's second browser Image/canvas/Blob-URL pipeline.
 *
 * Native camera URIs and oversized web captures still use compressImage so
 * every upload remains within the Storage bucket limit.
 */
export async function prepareCameraCapture(
  uri: string,
  options: CameraCapturePreparationOptions,
): Promise<PreparedImage> {
  const isJpegDataUri = JPEG_DATA_URI_PREFIX.test(uri);
  if (!isJpegDataUri && !isBlobUri(uri)) {
    return compressImage(uri, options);
  }

  let blob = isJpegDataUri ? decodeCameraJpegDataUri(uri) : await fetchBlob(uri);
  if (!isJpegBlob(blob) || !hasJpegSignature(await readBlobBytes(blob))) {
    throw new Error('Camera capture did not contain a valid JPEG');
  }

  if (blob.type.toLowerCase() !== 'image/jpeg') {
    blob = new Blob([blob], { type: 'image/jpeg' });
  }

  const targetBytes = options.maxBytes ?? MAX_IMAGE_SIZE_BYTES;
  if (blob.size > targetBytes) {
    return compressImage(uri, options);
  }

  const quality = clampQuality(options.quality ?? 0.9, FALLBACK_MIN_QUALITY);
  return {
    blob,
    width: Number.isFinite(options.width) && options.width > 0 ? options.width : 0,
    height: Number.isFinite(options.height) && options.height > 0 ? options.height : 0,
    size: blob.size,
    mimeType: 'image/jpeg',
    metadata: {
      originalSize: blob.size,
      compressedSize: blob.size,
      compressionRatio: 1,
      iterations: 0,
      quality,
      resized: false,
      targetBytes,
    },
    cleanup: () => undefined,
  };
}
