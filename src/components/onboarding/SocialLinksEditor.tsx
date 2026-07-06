import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { SOCIAL_PLATFORMS, extractUsername } from '../../constants/socialPlatforms';
import GradientTitle from '../GradientTitle';
import { styles } from '../../styles/completeProfile.styles';
import { theme } from '../../styles/theme';

type SocialLinksEditorProps = {
  instagram: string;
  linkedin: string;
  setInstagram: (value: string) => void;
  setLinkedin: (value: string) => void;
  setTwitter: (value: string) => void;
  twitter: string;
};

type ModalState = 'instagram' | 'twitter' | 'linkedin' | null;

const labels = {
  instagram: {
    title: 'Instagram Username',
    helper: 'instagram.com',
  },
  twitter: {
    title: 'X (Twitter) Username',
    helper: 'x.com',
  },
  linkedin: {
    title: 'LinkedIn Username',
    helper: 'linkedin.com/in',
  },
};

export const SocialLinksEditor = ({
  instagram,
  linkedin,
  setInstagram,
  setLinkedin,
  setTwitter,
  twitter,
}: SocialLinksEditorProps) => {
  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const modalValue =
    activeModal === 'instagram' ? instagram : activeModal === 'twitter' ? twitter : linkedin;
  const setModalValue =
    activeModal === 'instagram'
      ? setInstagram
      : activeModal === 'twitter'
        ? setTwitter
        : setLinkedin;
  const modalLabels = activeModal ? labels[activeModal] : labels.instagram;

  return (
    <View style={styles.socialSection}>
      <GradientTitle text="Social Links" style={styles.sectionTitle} variant="prism" />

      <View style={styles.socialCard}>
        <View style={[styles.socialBadge, styles.instagramBadge]}>
          {SOCIAL_PLATFORMS.instagram.renderIcon({ size: 20, color: theme.prism.colors.text })}
        </View>
        <View style={styles.socialContent}>
          <Text style={styles.socialLabel}>Instagram</Text>
          <Text style={styles.socialValue}>{instagram || 'No link added'}</Text>
        </View>
        <Pressable style={styles.editButton} onPress={() => setActiveModal('instagram')}>
          <Feather name="edit-3" size={16} color={theme.prism.colors.text} />
        </Pressable>
      </View>

      <View style={styles.socialCard}>
        <View style={[styles.socialBadge, styles.outlinedBadge]}>
          {SOCIAL_PLATFORMS.twitter.renderIcon({ size: 20, color: theme.prism.colors.text })}
        </View>
        <View style={styles.socialContent}>
          <Text style={styles.socialLabel}>X</Text>
          <Text style={styles.socialValue}>{twitter || 'No link added'}</Text>
        </View>
        <Pressable style={styles.editButton} onPress={() => setActiveModal('twitter')}>
          <Feather name="edit-3" size={16} color={theme.prism.colors.text} />
        </Pressable>
      </View>

      <View style={styles.socialCard}>
        <View
          style={[
            styles.socialBadge,
            { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor },
          ]}
        >
          {SOCIAL_PLATFORMS.linkedin.renderIcon({ size: 20, color: theme.prism.colors.text })}
        </View>
        <View style={styles.socialContent}>
          <Text style={styles.socialLabel}>LinkedIn</Text>
          <Text style={styles.socialValue}>{linkedin || 'No link added'}</Text>
        </View>
        <Pressable style={styles.editButton} onPress={() => setActiveModal('linkedin')}>
          <Feather name="edit-3" size={16} color={theme.prism.colors.text} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={!!activeModal}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalLabels.title}</Text>
            <TextInput
              value={modalValue}
              onChangeText={(text) => setModalValue(extractUsername(text))}
              placeholder="username"
              placeholderTextColor={theme.prism.colors.mutedDeep}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>
              Will link to: {modalLabels.helper}/{modalValue || 'username'}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalSave]} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalBtnLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
