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
};

export type Theme = typeof theme;
