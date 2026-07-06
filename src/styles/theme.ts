import { Platform } from 'react-native';

const PRIMARY = '#2563EB';
const PRIMARY_MID = '#4F46E5';
const SECONDARY = '#7E22CE';
const PRISM_CYAN = '#38BDF8';
const BACKGROUND_DARK = '#0A0A0A';
const SURFACE_DARK = '#101225';
const PRISM_BACKGROUND = '#080D10';
const PRISM_SURFACE = '#141820';
const PRISM_CARD = '#1C2430';
const SYSTEM_FONT_WEB =
  '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DISPLAY_FONT_WEB =
  '"Satoshi", "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SYSTEM_FONT = Platform.OS === 'web' ? SYSTEM_FONT_WEB : undefined;
const DISPLAY_FONT = Platform.OS === 'web' ? DISPLAY_FONT_WEB : undefined;

export const gradientColors = [PRIMARY, PRIMARY_MID, SECONDARY] as const;
export const prismGradientColors = [PRIMARY, SECONDARY, PRISM_CYAN] as const;

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
  prism: {
    colors: {
      background: PRISM_BACKGROUND,
      surface: PRISM_SURFACE,
      card: PRISM_CARD,
      cardDeep: '#0B1118',
      border: 'rgba(148, 163, 184, 0.26)',
      borderStrong: 'rgba(56, 189, 248, 0.55)',
      text: '#F8FAFC',
      textSoft: '#CBD5E1',
      muted: '#94A3B8',
      mutedDeep: '#64748B',
      primary: PRIMARY,
      secondary: SECONDARY,
      accent: PRISM_CYAN,
      success: '#22C55E',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
    gradients: {
      brand: prismGradientColors,
      surface: ['rgba(37, 99, 235, 0.18)', 'rgba(126, 34, 206, 0.12)', 'rgba(56, 189, 248, 0.10)'] as const,
    },
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
  typography: {
    fontFamily: {
      web: SYSTEM_FONT_WEB,
      displayWeb: DISPLAY_FONT_WEB,
      system: SYSTEM_FONT,
      display: DISPLAY_FONT,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    display: {
      fontFamily: DISPLAY_FONT,
      fontSize: 48,
      lineHeight: 52,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
    title: {
      fontFamily: DISPLAY_FONT,
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
    body: {
      fontFamily: SYSTEM_FONT,
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: SYSTEM_FONT,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: '600' as const,
    },
    nav: {
      fontFamily: SYSTEM_FONT,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
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
      letterSpacing: 0,
      fontWeight: '700' as const,
      fontFamily: DISPLAY_FONT,
    },
  },
};

export type Theme = typeof theme;
