import * as FileSystem from 'expo-file-system/legacy';
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

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  size: number;
  mimeType: string;
  metadata: CompressionMetadata;
}

export interface ImageCompressionOptions {
  maxBytes?: number;
  initialQuality?: number;
  minQuality?: number;
  minResizeWidth?: number;
}

type PreparedSource = {
  uri: string;
  mimeType: string;
  cleanup?: () => Promise<void>;
  embeddedBase64?: string;
};

const isDataUri = (value: string) => value.startsWith('data:');
const isBlobUri = (value: string) => value.startsWith('blob:');
const isHttpUri = (value: string) => /^https?:\/\//i.test(value);

const stripDataUriPrefix = (value: string): { mimeType: string; base64: string } => {
  const match = value.match(/^data:(.*?);base64,(.+)$/);
  if (!match || !match[2]) {
    throw new Error('Invalid data URI supplied');
  }
  return {
    mimeType: match[1] || 'image/jpeg',
    base64: match[2].replace(/\s/g, ''),
  };
};

const inferMimeFromPath = (uri: string): string => {
  const extensionMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
};

const mimeToExtension = (mime: string): string => {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('heic') || mime.includes('heif')) return 'heic';
  return 'jpg';
};

// Map extension back to a proper image MIME (used for web fallbacks)
const extensionToMime = (ext: string): string => {
  const e = ext.toLowerCase();
  switch (e) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
    case 'heif':
      return 'image/heic';
    case 'jpeg':
    case 'jpg':
    default:
      return 'image/jpeg';
  }
};

const base64SizeInBytes = (base64: string): number => {
  const cleaned = base64.replace(/=+$/, '');
  return Math.floor((cleaned.length * 3) / 4);
};

export const base64ToUint8Array = (value: string): Uint8Array => {
  const base64Value = value.startsWith('data:')
    ? value.slice(value.indexOf(',') + 1)
    : value;

  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const sanitized = base64Value.replace(/[^A-Za-z0-9+/=]/g, '');
  let bufferLength = (sanitized.length * 3) / 4;

  if (sanitized.endsWith('==')) {
    bufferLength -= 2;
  } else if (sanitized.endsWith('=')) {
    bufferLength -= 1;
  }

  const bytes = new Uint8Array(bufferLength | 0);
  let bufferIndex = 0;

  for (let i = 0; i < sanitized.length; i += 4) {
    const encoded1 = base64Chars.indexOf(sanitized[i]);
    const encoded2 = base64Chars.indexOf(sanitized[i + 1]);
    const encoded3 = base64Chars.indexOf(sanitized[i + 2]);
    const encoded4 = base64Chars.indexOf(sanitized[i + 3]);

    const triplet = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 & 63) << 6) | (encoded4 & 63);

    if (sanitized[i + 2] === '=') {
      bytes[bufferIndex++] = (triplet >> 16) & 0xff;
    } else if (sanitized[i + 3] === '=') {
      bytes[bufferIndex++] = (triplet >> 16) & 0xff;
      bytes[bufferIndex++] = (triplet >> 8) & 0xff;
    } else {
      bytes[bufferIndex++] = (triplet >> 16) & 0xff;
      bytes[bufferIndex++] = (triplet >> 8) & 0xff;
      bytes[bufferIndex++] = triplet & 0xff;
    }
  }

  return bytes;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(buffer).toString('base64');
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  throw new Error('No base64 encoder available in this environment');
};

const writeBase64ToCache = async (base64: string, extension: string): Promise<string> => {
  const directory = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
  // On web, FileSystem directories are unavailable. Fall back to a data URI.
  if (!directory) {
    const mime = extensionToMime(extension);
    return `data:${mime};base64,${base64}`;
  }
  const uniqueName = `img-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
  const fileUri = `${directory}${uniqueName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
  return fileUri;
};

const safelyDelete = async (uri: string | undefined) => {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    // Example using new API if/when you migrate:
    // const file = new File(uri);
    // return file.delete();
  } catch {
    // Ignore cleanup failures – they are non-blocking.
  }
};

const prepareInputUri = async (uri: string): Promise<PreparedSource> => {
  if (isDataUri(uri)) {
    const { mimeType, base64 } = stripDataUriPrefix(uri);
    const tempUri = await writeBase64ToCache(base64, mimeToExtension(mimeType));
    return {
      uri: tempUri,
      mimeType,
      embeddedBase64: base64,
      cleanup: () => safelyDelete(tempUri),
    };
  }

  if (isBlobUri(uri) || isHttpUri(uri)) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to fetch image for compression');
    }
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeType = blob.type || inferMimeFromPath(uri);
    const tempUri = await writeBase64ToCache(base64, mimeToExtension(mimeType));
    return {
      uri: tempUri,
      mimeType,
      embeddedBase64: base64,
      cleanup: () => safelyDelete(tempUri),
    };
  }

  return {
    uri,
    mimeType: inferMimeFromPath(uri),
  };
};

const getResourceSize = async (uri: string, inlineBase64?: string): Promise<number> => {
  if (isDataUri(uri)) {
    const { base64 } = stripDataUriPrefix(uri);
    return base64SizeInBytes(base64);
  }

  if (inlineBase64) {
    return base64SizeInBytes(inlineBase64);
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && typeof info.size === 'number') {
      return info.size;
    }
  } catch {
    // Swallow errors; we'll fall back to other strategies.
  }

  if (isBlobUri(uri) || isHttpUri(uri)) {
    try {
      const response = await fetch(uri, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return Number.parseInt(contentLength, 10);
      }
    } catch {
      // Ignore failures.
    }
  }

  return 0;
};

const computeResultSize = async (result: ImageManipulator.ImageResult): Promise<number> => {
  if (result.base64) {
    return base64SizeInBytes(result.base64);
  }
  return getResourceSize(result.uri);
};

const clampQuality = (value: number, min: number) => Math.max(Math.min(value, 1), min);

export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {},
): Promise<CompressedImage> {
  const targetBytes = options.maxBytes ?? MAX_IMAGE_SIZE_BYTES;
  const minQuality = options.minQuality ?? MIN_QUALITY;
  const minResizeWidth = options.minResizeWidth ?? DEFAULT_MIN_RESIZE_WIDTH;
  const initialQuality = clampQuality(options.initialQuality ?? 0.92, minQuality);

  const prepared = await prepareInputUri(uri);
  const originalSize = await getResourceSize(uri, prepared.embeddedBase64);

  let quality = initialQuality;
  let iterations = 0;
  let resized = false;

  const performManipulation = async (
    resizeWidth?: number,
    forcedQuality?: number,
  ): Promise<ImageManipulator.ImageResult> => {
    const actions = resizeWidth ? [{ resize: { width: resizeWidth } }] : [];
    return ImageManipulator.manipulateAsync(
      prepared.uri,
      actions,
      {
        compress: clampQuality(forcedQuality ?? quality, FALLBACK_MIN_QUALITY),
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );
  };

  let result = await performManipulation();
  let size = await computeResultSize(result);

  if (size <= targetBytes && originalSize > 0 && originalSize <= targetBytes) {
    await prepared.cleanup?.();
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      base64: result.base64,
      size,
      mimeType: 'image/jpeg',
      metadata: {
        originalSize,
        compressedSize: size,
        compressionRatio: originalSize > 0 ? size / originalSize : 1,
        iterations,
        quality,
        resized,
        targetBytes,
      },
    };
  }

  while (size > targetBytes && quality > minQuality + 0.001) {
    iterations += 1;
    quality = clampQuality(quality - QUALITY_STEP, minQuality);
    result = await performManipulation(undefined, quality);
    size = await computeResultSize(result);
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

      result = await performManipulation(currentWidth, quality);
      size = await computeResultSize(result);
    }

    if (size > targetBytes && quality > FALLBACK_MIN_QUALITY) {
      while (size > targetBytes && quality > FALLBACK_MIN_QUALITY + 0.001) {
        iterations += 1;
        quality = clampQuality(quality - QUALITY_STEP, FALLBACK_MIN_QUALITY);
        result = await performManipulation(currentWidth, quality);
        size = await computeResultSize(result);
      }
    }
  }

  await prepared.cleanup?.();

  const finalSize = size;
  const ratio = originalSize > 0 ? finalSize / originalSize : 1;

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    base64: result.base64,
    size: finalSize,
    mimeType: 'image/jpeg',
    metadata: {
      originalSize: originalSize > 0 ? originalSize : finalSize,
      compressedSize: finalSize,
      compressionRatio: ratio,
      iterations,
      quality,
      resized,
      targetBytes,
    },
  };
}
