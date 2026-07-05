import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import GradientTitle from './GradientTitle';
import { theme } from '../styles/theme';

export type LegalSection = {
  title: string;
  body: string[];
};

type LegalDocumentScreenProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

const UPDATED_AT = 'July 4, 2026';

export const LegalDocumentScreen: React.FC<LegalDocumentScreenProps> = ({
  eyebrow,
  title,
  intro,
  sections,
}) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWide ? styles.scrollContentWide : null]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.shell}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <GradientTitle text={title} style={styles.title} numberOfLines={2} />
          <Text style={styles.updated}>Draft for MVP launch hardening • Last updated {UPDATED_AT}</Text>
          <Text style={styles.intro}>{intro}</Text>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Draft notice</Text>
            <Text style={styles.noticeText}>
              This page is a plain-language product draft, not legal advice. Review it with a
              qualified lawyer before a public launch.
            </Text>
          </View>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.secondaryLabel}>Back to Zenlit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/auth')}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.primaryLabel}>Get started</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  scrollContentWide: {
    paddingVertical: 48,
  },
  shell: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  eyebrow: {
    ...theme.typography.label,
    color: '#60a5fa',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    ...theme.typography.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.9,
  },
  updated: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },
  intro: {
    marginTop: 18,
    color: '#dbeafe',
    fontSize: 16,
    lineHeight: 24,
  },
  noticeCard: {
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.28)',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    padding: 16,
  },
  noticeTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeText: {
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  paragraph: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 10,
  },
  actions: {
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});

export default LegalDocumentScreen;
