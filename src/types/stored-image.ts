export type StorageBucket = 'profile-images' | 'post-images' | 'feedback-images';

export type ImageUploadTarget = {
  bucket: StorageBucket;
  prefix: string;
};

export type StoredImage = {
  uploadId: string;
  publicUrl: string;
  bucket: StorageBucket;
  objectPath: string;
  width: number;
  height: number;
  size: number;
  mimeType: 'image/jpeg';
};
