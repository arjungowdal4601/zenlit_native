import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '../icons';

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

const LINK_LABELS = {
  instagram: {
    label: 'Instagram',
    title: 'Instagram Username',
    helper: 'instagram.com',
  },
  twitter: {
    label: 'X',
    title: 'X (Twitter) Username',
    helper: 'x.com',
  },
  linkedin: {
    label: 'LinkedIn',
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
  const items = [
    {
      key: 'instagram' as const,
      value: instagram,
      setValue: setInstagram,
      badgeStyle: styles.instagramBadge,
    },
    {
      key: 'twitter' as const,
      value: twitter,
      setValue: setTwitter,
      badgeStyle: styles.outlinedBadge,
    },
    {
      key: 'linkedin' as const,
      value: linkedin,
      setValue: setLinkedin,
      badgeStyle: { backgroundColor: SOCIAL_PLATFORMS.linkedin.style.backgroundColor },
    },
  ];
  const activeItem = items.find((item) => item.key === activeModal) ?? items[0];
  const modalLabels = LINK_LABELS[activeItem.key];

  return (
    <View style={styles.socialSection}>
      <GradientTitle text="Social Links" style={styles.sectionTitle} variant="prism" />

      {items.map((item) => (
        <View key={item.key} style={styles.socialCard}>
          <View style={[styles.socialBadge, item.badgeStyle]}>
            {SOCIAL_PLATFORMS[item.key].renderIcon({ size: 20, color: theme.prism.colors.text })}
          </View>
          <View style={styles.socialContent}>
            <Text style={styles.socialLabel}>{LINK_LABELS[item.key].label}</Text>
            <Text style={styles.socialValue}>{item.value || 'No link added'}</Text>
          </View>
          <Pressable style={styles.editButton} onPress={() => setActiveModal(item.key)}>
            <Feather name="edit-3" size={16} color={theme.prism.colors.text} />
          </Pressable>
        </View>
      ))}

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
              value={activeItem.value}
              onChangeText={(text) => activeItem.setValue(extractUsername(text))}
              placeholder="username"
              placeholderTextColor={theme.prism.colors.mutedDeep}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.modalHelper}>
              Will link to: {modalLabels.helper}/{activeItem.value || 'username'}
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
