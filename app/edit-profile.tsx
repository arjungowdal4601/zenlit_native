import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, Image, ImageSourcePropType, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ImageUploadDialog from '../src/components/ImageUploadDialog';
import { SOCIAL_PLATFORMS, extractUsername } from '../src/constants/socialPlatforms';
import GradientTitle from '../src/components/GradientTitle';
import { supabase } from '../src/lib/supabase';
import { getCurrentUserProfile, updateSocialLinks, uploadImage } from '../src/lib/database';
import { compressImage } from '../src/utils/imageCompression';

const EditProfileScreen: React.FC = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [bannerImage, setBannerImage] = useState<ImageSourcePropType | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);

  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'banner'>('avatar');

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadUserData();
    return () => {
      mountedRef.current = false;
      clearSuccessTimeout();
    };
  }, []);

  const clearSuccessTimeout = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const { profile, socialLinks } = await getCurrentUserProfile();

      if (profile && mountedRef.current) {
        setDisplayName(profile.display_name);
        if (socialLinks) {
          setBio(socialLinks.bio || '');
          setProfileImage(socialLinks.profile_pic_url || null);
          setBannerImage(socialLinks.banner_url ? { uri: socialLinks.banner_url } : null);
          setInstagram(socialLinks.instagram || '');
          setTwitter(socialLinks.x_twitter || '');
          setLinkedin(socialLinks.linkedin || '');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const uploadImageIfNeeded = async (uri: string | null | undefined, filePrefix: 'avatar' | 'banner', userId: string): Promise<string | undefined> => {
    try {
      if (!uri) return undefined;
      const isRemote = uri.startsWith('http');
      const isLocal = uri.startsWith('file:') || uri.startsWith('data:') || uri.startsWith('blob:');

      if (isRemote && !isLocal) {
        return uri;
      }

      const compressed = await compressImage(uri);
      const fileName = `${userId}/${filePrefix}-${Date.now()}.jpg`;
      const { url, error } = await uploadImage(compressed.uri, 'profile-images', fileName);

      if (error || !url) {
        throw error ?? new Error('Upload failed');
      }

      return url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return undefined;
    }
  };

  const uploadImageIfNeededOld = async (uri: string | null | undefined, filePrefix: 'avatar' | 'banner', userId: string): Promise<string | undefined> => {
    try {
      if (!uri) return undefined;
      const isRemote = uri.startsWith('http');
      const isLocal = uri.startsWith('file:') || uri.startsWith('data:') || uri.startsWith('blob:');

      if (isRemote && !isLocal) {
        return uri;
      }

      const extMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      let contentType = 'image/jpeg';
      let ext = (extMatch && extMatch[1]) ? extMatch[1].toLowerCase() : 'jpg';

      if (uri.startsWith('data:')) {
        const mimeMatch = uri.match(/^data:(.*?);base64,/);
        if (mimeMatch && mimeMatch[1]) {
          contentType = mimeMatch[1];
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else ext = 'jpg';
        }
      } else {
        contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      }

      const fileName = `${userId}/${filePrefix}-${Date.now()}.${ext}`;

      const base64ToUint8Array = (b64: string): Uint8Array => {
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let bufferLength = b64.length * 0.75;
        const len = b64.length;
        let p = 0;
        let encoded1, encoded2, encoded3, encoded4;

        if (b64[len - 1] === '=') bufferLength--;
        if (b64[len - 2] === '=') bufferLength--;

        const bytes = new Uint8Array(bufferLength | 0);

        for (let i = 0; i < len; i += 4) {
          encoded1 = base64Chars.indexOf(b64[i]);
          encoded2 = base64Chars.indexOf(b64[i + 1]);
          encoded3 = base64Chars.indexOf(b64[i + 2]);
          encoded4 = base64Chars.indexOf(b64[i + 3]);

          const triplet = (encoded1 << 18) | (encoded2 << 12) | ((encoded3 & 63) << 6) | (encoded4 & 63);

          if (b64[i + 2] === '=') {
            bytes[p++] = (triplet >> 16) & 0xFF;
          } else if (b64[i + 3] === '=') {
            bytes[p++] = (triplet >> 16) & 0xFF;
            bytes[p++] = (triplet >> 8) & 0xFF;
          } else {
            bytes[p++] = (triplet >> 16) & 0xFF;
            bytes[p++] = (triplet >> 8) & 0xFF;
            bytes[p++] = triplet & 0xFF;
          }
        }
        return bytes;
      };

      let uploadBody: Uint8Array | Blob | ArrayBuffer;

      if (uri.startsWith('data:')) {
        const commaIndex = uri.indexOf(',');
        const base64Data = commaIndex !== -1 ? uri.slice(commaIndex + 1) : '';
        uploadBody = base64ToUint8Array(base64Data);
      } else if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        uploadBody = blob;
      } else {
        const response = await fetch(uri);
        const arrayBuffer = await (response as any).arrayBuffer?.();
        if (!arrayBuffer) {
          console.error('Unable to read file for upload in native environment');
          return undefined;
        }
        uploadBody = arrayBuffer as ArrayBuffer;
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, uploadBody as any, { contentType, upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return undefined;
      }

      const { data } = supabase.storage.from('profile-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Failed to upload image:', err);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const profileImageUri = typeof profileImage === 'string' ? profileImage : undefined;
      const bannerUri = (bannerImage as any)?.uri as string | undefined;

      const uploadedAvatarUrl = await uploadImageIfNeeded(profileImageUri, 'avatar', user.id);
      const uploadedBannerUrl = await uploadImageIfNeeded(bannerUri, 'banner', user.id);

      const payload: Record<string, any> = {
        bio: bio?.trim() || null,
        instagram: instagram?.trim() || null,
        x_twitter: twitter?.trim() || null,
        linkedin: linkedin?.trim() || null,
      };

      if (uploadedAvatarUrl) {
        payload.profile_pic_url = uploadedAvatarUrl;
      }

      if (uploadedBannerUrl) {
        payload.banner_url = uploadedBannerUrl;
      }

      const { error: updateError } = await updateSocialLinks(payload);

      if (updateError) {
        throw updateError;
      }

      clearSuccessTimeout();
      if (mountedRef.current) {
        setShowSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setShowSuccess(false);
            router.back();
            successTimeoutRef.current = null;
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (mountedRef.current) {
        setShowSuccess(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const openBannerMenu = () => {
    setUploadType('banner');
    setShowImageUploadDialog(true);
  };

  const openProfileMenu = () => {
    setUploadType('avatar');
    setShowImageUploadDialog(true);
  };

  const handleImageSelected = (imageUri: string) => {
    if (uploadType === 'avatar') {
      setProfileImage(imageUri || null);
    } else {
      setBannerImage(imageUri ? { uri: imageUri } : null);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.headerButton}>
              <Feather name="arrow-left" size={22} color="#ffffff" />
            </Pressable>
            <GradientTitle text="Edit Profile" style={styles.headerTitle} />
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <GradientTitle text="Edit Profile" style={styles.headerTitle} />
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {showSuccess && (
        <View style={styles.successBar}>
          <Feather name="check" size={18} color="#ffffff" />
          <Text style={styles.successText}>Profile updated successfully!</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerWrapper}>
          {bannerImage ? (
            <Image source={bannerImage} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerFallback]} />
          )}
          <Pressable style={styles.bannerOverlay} onPress={openBannerMenu}>
            <View style={styles.overlayCircle}>
              <Feather name="camera" size={18} color="#ffffff" />
            </View>
          </Pressable>
          <View style={styles.avatarWrapper}>
            <Pressable onPress={openProfileMenu} style={styles.avatarButton}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Feather name="user" size={44} color="#64748b" />
                </View>
              )}
              <View style={styles.avatarCamera}>
                <View style={styles.overlayCircle}>
                  <Feather name="camera" size={16} color="#ffffff" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor="#475569"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>

        <View style={styles.socialSection}>
          <GradientTitle text="Social Links" style={styles.sectionTitle} />

          <View style={styles.socialCard}>
            <View style={[styles.socialBadge, styles.instagramBadge]}>
              {SOCIAL_PLATFORMS.instagram.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>Instagram</Text>
              <Text style={styles.socialValue}>{instagram ? instagram : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowInstagramModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.socialCard}>
            <View style={[styles.socialBadge, styles.outlinedBadge]}>
              {SOCIAL_PLATFORMS.twitter.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>X</Text>
              <Text style={styles.socialValue}>{twitter ? twitter : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowTwitterModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.socialCard}>
            <View style={[styles.socialBadge, { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor }]}>
              {SOCIAL_PLATFORMS.linkedin.renderIcon({ size: 20, color: '#ffffff' })}
            </View>
            <View style={styles.socialContent}>
              <Text style={styles.socialLabel}>LinkedIn</Text>
              <Text style={styles.socialValue}>{linkedin ? linkedin : 'No link added'}</Text>
            </View>
            <Pressable style={styles.editButton} onPress={() => setShowLinkedinModal(true)}>
              <Feather name="edit-3" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.footerActions}>
          <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={handleBack} accessibilityRole="button">
            <Text style={[styles.actionLabel, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.saveButton, isSaving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
          >
            <Text style={styles.actionLabel}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal transparent visible={showInstagramModal} animationType="fade" onRequestClose={() => setShowInstagramModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Instagram Username</Text>
            <TextInput
              value={instagram}
              onChangeText={(text) => setInstagram(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: instagram.com/{instagram || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowInstagramModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowInstagramModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showTwitterModal} animationType="fade" onRequestClose={() => setShowTwitterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>X (Twitter) Username</Text>
            <TextInput
              value={twitter}
              onChangeText={(text) => setTwitter(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: x.com/{twitter || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowTwitterModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowTwitterModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showLinkedinModal} animationType="fade" onRequestClose={() => setShowLinkedinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LinkedIn Username</Text>
            <TextInput
              value={linkedin}
              onChangeText={(text) => setLinkedin(extractUsername(text))}
              placeholder="username"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>Will link to: linkedin.com/in/{linkedin || 'username'}</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setShowLinkedinModal(false)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setShowLinkedinModal(false)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ImageUploadDialog
        visible={showImageUploadDialog}
        onClose={() => setShowImageUploadDialog(false)}
        onImageSelected={handleImageSelected}
        title={uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={uploadType === 'avatar' ? profileImage : (bannerImage as any)?.uri}
        onRemove={() => {
          if (uploadType === 'avatar') {
            setProfileImage(null);
          } else {
            setBannerImage(null);
          }
        }}
        showRemoveOption={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safeArea: { backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12,
  },
  headerButton: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
  successBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10 },
  successText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  content: { paddingBottom: 120 },
  bannerWrapper: { position: 'relative', marginBottom: 60 },
  bannerImage: { width: '100%', height: 200, borderRadius: 0 },
  bannerFallback: { backgroundColor: '#1f2937' },
  bannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  avatarWrapper: { position: 'absolute', left: 20, bottom: -50 },
  avatarButton: { borderRadius: 8, borderWidth: 2, borderColor: '#000000', padding: 2, backgroundColor: '#000000' },
  avatar: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#111827' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  avatarCamera: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  formSection: { paddingHorizontal: 20 },
  label: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { color: '#ffffff', backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  socialSection: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  socialCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)', borderRadius: 12, backgroundColor: '#000000', marginBottom: 12 },
  socialBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)', backgroundColor: '#000000' },
  instagramBadge: { backgroundColor: '#dc2743' },
  outlinedBadge: { backgroundColor: '#000000', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  socialContent: { flex: 1, minWidth: 0 },
  socialLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  socialValue: { color: '#94a3b8', fontSize: 14 },
  charCount: { color: '#94a3b8', fontSize: 12, alignSelf: 'flex-end', marginTop: 4 },
  editButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  footerActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 24 },
  actionButton: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1 },
  cancelButton: { backgroundColor: '#000000', borderColor: 'rgba(148, 163, 184, 0.35)' },
  saveButton: { backgroundColor: '#6d28d9', borderColor: '#6d28d9' },
  actionLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  cancelLabel: { color: '#cbd5f5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '90%', maxWidth: 420, backgroundColor: '#000000', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalInput: { color: '#ffffff', backgroundColor: '#000000', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalHelper: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  modalCancel: { backgroundColor: '#000000', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)' },
  modalSave: { backgroundColor: '#6d28d9' },
  modalBtnLabel: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});

export default EditProfileScreen;
