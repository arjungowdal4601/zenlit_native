export const colors = {
  background: '#0E0F12',
  surface: '#16181D',
  dropdown: 'rgba(22, 24, 29, 0.98)',
  overlay: 'rgba(5, 7, 10, 0.74)',
  border: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.08)',
  icon: '#E8EAED',
  text: '#E8EAED',
  subtitle: '#9AA4AF',
  accent: '#2573FF',
  muted: '#1E2228',
  tabBackground: 'rgba(14, 15, 18, 0.92)',
  focusOverlay: 'rgba(255, 255, 255, 0.06)',
  shadow: '#000000',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  title: {
    size: 16,
    weight: '700' as const,
    lineHeight: 20,
  },
  handle: {
    size: 14,
    weight: '600' as const,
    color: colors.subtitle,
  },
  body: {
    size: 14,
    weight: '400' as const,
    color: colors.text,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const gradients = {
  primary: ['#2563EB', '#7E22CE'] as const,
  instagram: ['#F58529', '#DD2A7B', '#8134AF'] as const,
};

export const iconSizes = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
};

export const avatar = {
  size: 52,
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  gradients,
  iconSizes,
  avatar,
};

export type Theme = typeof theme;
