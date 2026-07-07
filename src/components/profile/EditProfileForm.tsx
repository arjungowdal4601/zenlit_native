import { Feather, type IconName } from '../icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientTitle from '../GradientTitle';
import ImageUploadDialog from '../ImageUploadDialog';
import { SOCIAL_PLATFORMS, extractUsername } from '../../constants/socialPlatforms';
import type {
  EditProfileController,
  EditProfileSocialField,
  EditProfileToast,
} from '../../hooks/useEditProfile';
import { ProfileImageEditor } from './ProfileImageEditor';
import { styles } from './editProfile.styles';

const socialItems: Array<{
  key: EditProfileSocialField;
  label: string;
  title: string;
  helperPrefix: string;
}> = [
  { key: 'instagram', label: 'Instagram', title: 'Instagram Username', helperPrefix: 'instagram.com/' },
  { key: 'twitter', label: 'X', title: 'X (Twitter) Username', helperPrefix: 'x.com/' },
  { key: 'linkedin', label: 'LinkedIn', title: 'LinkedIn Username', helperPrefix: 'linkedin.com/in/' },
];

const Header = ({ onBack }: { onBack: () => void }) => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
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
);

const ToastBar = ({ toast }: { toast: EditProfileToast }) => {
  const style =
    toast.type === 'success'
      ? styles.toastSuccess
      : toast.type === 'error'
        ? styles.toastError
        : toast.type === 'warning'
          ? styles.toastWarning
          : styles.toastInfo;
  const icon: IconName =
    toast.type === 'success'
      ? 'check-circle'
      : toast.type === 'error'
        ? 'alert-triangle'
        : toast.type === 'warning'
          ? 'alert-circle'
          : 'info';

  return (
    <View style={[styles.toastBar, style]}>
      <Feather name={icon} size={18} color="#ffffff" />
      <Text style={styles.toastText}>{toast.message}</Text>
    </View>
  );
};

const SocialRow = ({
  item,
  value,
  onPress,
}: {
  item: (typeof socialItems)[number];
  value: string;
  onPress: () => void;
}) => {
  const platformKey = item.key === 'twitter' ? 'twitter' : item.key;
  const badgeStyle =
    item.key === 'instagram'
      ? styles.instagramBadge
      : item.key === 'twitter'
        ? styles.outlinedBadge
        : { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor };

  return (
    <View style={styles.socialCard}>
      <View style={[styles.socialBadge, badgeStyle]}>
        {SOCIAL_PLATFORMS[platformKey].renderIcon({ size: 20, color: '#ffffff' })}
      </View>
      <View style={styles.socialContent}>
        <Text style={styles.socialLabel}>{item.label}</Text>
        <Text style={styles.socialValue}>{value || 'No link added'}</Text>
      </View>
      <Pressable style={styles.editButton} onPress={onPress}>
        <Feather name="edit-3" size={16} color="#ffffff" />
      </Pressable>
    </View>
  );
};

const SocialUsernameModal = ({
  item,
  value,
  onChange,
  onClose,
}: {
  item: (typeof socialItems)[number];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) => (
  <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{item.title}</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(extractUsername(text))}
          placeholder="username"
          placeholderTextColor="#64748b"
          style={styles.modalInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.modalHelper}>
          Will link to: {item.helperPrefix}
          {value || 'username'}
        </Text>
        <View style={styles.modalActions}>
          <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={onClose}>
            <Text style={styles.modalBtnLabel}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={onClose}>
            <Text style={styles.modalBtnLabel}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

export const EditProfileForm = ({ profile }: { profile: EditProfileController }) => {
  const { draft } = profile;
  const activeModal = socialItems.find((item) => item.key === profile.activeSocialModal);
  const bannerUri = (draft.bannerImage as { uri?: string } | null)?.uri;

  if (profile.loading) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Header onBack={profile.handleBack} />
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
      <Header onBack={profile.handleBack} />
      {profile.toast ? <ToastBar toast={profile.toast} /> : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileImageEditor
          bannerImage={draft.bannerImage}
          profileImage={draft.profileImage}
          onEditBanner={profile.openBannerMenu}
          onEditProfile={profile.openProfileMenu}
        />

        <View style={styles.formSection}>
          <Text style={[styles.label, { marginTop: 0 }]}>Display Name</Text>
          <TextInput
            value={draft.displayName}
            onChangeText={(text) => profile.setDraftField('displayName', text.slice(0, 50))}
            placeholder="Your display name"
            placeholderTextColor="#475569"
            style={styles.input}
            maxLength={50}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Bio</Text>
          <TextInput
            value={draft.bio}
            onChangeText={(text) => profile.setDraftField('bio', text.slice(0, 500))}
            placeholder="Tell about yourself..."
            placeholderTextColor="#475569"
            style={[styles.input, styles.textarea]}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{draft.bio.length}/500</Text>
        </View>

        <View style={styles.socialSection}>
          <GradientTitle text="Social Links" style={styles.sectionTitle} />
          {socialItems.map((item) => (
            <SocialRow
              key={item.key}
              item={item}
              value={draft[item.key]}
              onPress={() => profile.openSocialModal(item.key)}
            />
          ))}
        </View>

        <View style={styles.footerActions}>
          <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={profile.handleCancel} accessibilityRole="button">
            <Text style={[styles.actionLabel, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.saveButton, profile.isSaving && { opacity: 0.5 }]}
            onPress={profile.handleSave}
            disabled={profile.isSaving}
            accessibilityRole="button"
          >
            <Text style={styles.actionLabel}>{profile.isSaving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {activeModal ? (
        <SocialUsernameModal
          item={activeModal}
          value={draft[activeModal.key]}
          onChange={(value) => profile.setDraftField(activeModal.key, value)}
          onClose={profile.closeSocialModal}
        />
      ) : null}

      <ImageUploadDialog
        visible={profile.showImageUploadDialog}
        onClose={profile.closeImageUploadDialog}
        onImageSelected={profile.handleImageSelected}
        title={profile.uploadType === 'avatar' ? 'Profile Picture' : 'Banner Image'}
        currentImage={profile.uploadType === 'avatar' ? draft.profileImage : bannerUri}
        onRemove={profile.handleImageRemove}
        showRemoveOption={true}
      />
    </View>
  );
};
