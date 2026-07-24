import * as ImageManipulator from 'expo-image-manipulator';

import {
  compressImage,
  prepareCameraCapture,
} from '../../src/utils/imageCompression';
import {
  VALID_2X2_JPEG_BYTES,
  VALID_2X2_JPEG_DATA_URI,
} from '../fixtures/imageFixtures';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: jest.fn(),
}));

const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.MockedFunction<
  typeof ImageManipulator.manipulateAsync
>;

describe('compressImage', () => {
  const originalFetch = global.fetch;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  const readBlobBytes = async (blob: Blob) => {
    if (typeof blob.arrayBuffer === 'function') {
      return new Uint8Array(await blob.arrayBuffer());
    }

    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  };

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectUrl,
    });
    jest.clearAllMocks();
  });

  it('converts a complete Expo web-camera JPEG directly into binary without ImageManipulator', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await prepareCameraCapture(VALID_2X2_JPEG_DATA_URI, {
      width: 2,
      height: 2,
      maxBytes: VALID_2X2_JPEG_BYTES.byteLength + 1,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockManipulateAsync).not.toHaveBeenCalled();
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.size).toBe(VALID_2X2_JPEG_BYTES.byteLength);
    const resultBytes = await readBlobBytes(result.blob);
    expect(Array.from(resultBytes)).toEqual(Array.from(VALID_2X2_JPEG_BYTES));
    expect(Array.from(resultBytes.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);
    expect(result).not.toHaveProperty('uri');
    expect(result).not.toHaveProperty('base64');
    expect(JSON.stringify(result)).not.toContain(VALID_2X2_JPEG_DATA_URI);
  });

  it('uploads the confirmed camera Blob preview without sending it through ImageManipulator', async () => {
    const previewBlob = new Blob([VALID_2X2_JPEG_BYTES], { type: 'image/jpeg' });
    const fetchSpy = jest.fn(async () => ({
      ok: true,
      blob: async () => previewBlob,
    }));
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await prepareCameraCapture('blob:https://zenlit.test/camera-preview', {
      width: 2,
      height: 2,
      maxBytes: VALID_2X2_JPEG_BYTES.byteLength + 1,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('blob:https://zenlit.test/camera-preview');
    expect(mockManipulateAsync).not.toHaveBeenCalled();
    expect(result.blob).toBe(previewBlob);
    expect(Array.from(await readBlobBytes(result.blob))).toEqual(
      Array.from(VALID_2X2_JPEG_BYTES),
    );
    expect(result).not.toHaveProperty('uri');
    expect(result).not.toHaveProperty('base64');
  });

  it('reduces quality without ever asking ImageManipulator for Base64', async () => {
    const blobs = [
      new Blob([new Uint8Array(200)], { type: 'image/jpeg' }),
      new Blob([new Uint8Array(80)], { type: 'image/jpeg' }),
    ];
    global.fetch = jest.fn(async (uri: string | URL | Request) => {
      const value = String(uri);
      const blob = value === 'file://source.jpg'
        ? new Blob([new Uint8Array(240)], { type: 'image/jpeg' })
        : blobs[Number(value.slice(-1)) - 1];
      return { ok: true, blob: async () => blob };
    }) as unknown as typeof fetch;
    mockManipulateAsync
      .mockResolvedValueOnce({ uri: 'blob:result-1', width: 1200, height: 800 })
      .mockResolvedValueOnce({ uri: 'blob:result-2', width: 1200, height: 800 });

    const result = await compressImage('file://source.jpg', {
      maxBytes: 100,
      initialQuality: 0.92,
      minQuality: 0.8,
    });

    expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
    expect(mockManipulateAsync.mock.calls.every((call) => call[2]?.base64 === false)).toBe(true);
    expect(result.size).toBe(80);
    expect(result.metadata.iterations).toBe(1);
  });
});
