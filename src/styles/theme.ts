export const theme = {
  colors: {
    background: '#000000',
    surface: '#020617',
    overlay: 'rgba(2, 6, 23, 0.85)',
    border: 'rgba(148, 163, 184, 0.25)',
    text: '#ffffff',
    muted: '#94a3b8',
    icon: '#ffffff',
    accent: '#6366f1',
    headerBackground: '#000000',
  },
  gradients: {
    header: {
      from: '#4c6ef5',
      to: '#c084fc',
    },
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  header: {
    height: 64,
    paddingHorizontal: 24,
    contentSpacing: 12,
    iconSize: 24,
    touchSize: 44,
    title: {
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.4,
      fontWeight: '700' as const,
    },
  },
};

export type Theme = typeof theme;
