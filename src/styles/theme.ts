const PRIMARY = '#2563EB';
const PRIMARY_MID = '#4F46E5';
const SECONDARY = '#7E22CE';
const BACKGROUND_DARK = '#0A0A0A';
const SURFACE_DARK = '#101225';

export const gradientColors = [PRIMARY, PRIMARY_MID, SECONDARY] as const;

export const theme = {
  colors: {
    background: BACKGROUND_DARK,
    surface: SURFACE_DARK,
    overlay: 'rgba(16, 18, 37, 0.88)',
    border: 'rgba(148, 163, 184, 0.18)',
    text: '#F8FAFC',
    muted: '#94A3B8',
    icon: '#E2E8F0',
    iconInactive: '#94A3B8',
    accent: PRIMARY,
    primary: PRIMARY,
    secondary: SECONDARY,
    headerBackground: 'rgba(10, 10, 10, 0.92)',
  },
  gradients: {
    header: {
      from: PRIMARY,
      to: SECONDARY,
      colors: gradientColors,
    },
    surface: {
      from: 'rgba(37, 99, 235, 0.35)',
      to: 'rgba(126, 34, 206, 0.25)',
      colors: ['rgba(37, 99, 235, 0.35)', 'rgba(126, 34, 206, 0.25)'] as const,
    },
    background: {
      colors: ['#000000', '#000000'] as const,
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
    height: 56,
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
