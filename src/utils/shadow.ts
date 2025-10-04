import { Platform, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

type ShadowConfig = {
  native: ViewStyle;
  web?: string;
};

export type ShadowStyle = ViewStyle & { boxShadow?: string };

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const isShort = normalized.length === 3 || normalized.length === 4;
  const full = isShort
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;

  const r = parseInt(full.substring(0, 2), 16) || 0;
  const g = parseInt(full.substring(2, 4), 16) || 0;
  const b = parseInt(full.substring(4, 6), 16) || 0;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const normalizeAlpha = (value: unknown, fallback: number) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const normalizeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const deriveWebShadow = (native: ViewStyle): string => {
  const shadowColor = (native as ShadowStyle).shadowColor ?? '#000000';
  const shadowOpacity = normalizeAlpha((native as ShadowStyle).shadowOpacity, 0.25);
  const shadowRadius = normalizeNumber((native as ShadowStyle).shadowRadius, 12);
  const offset = (native as ShadowStyle).shadowOffset ?? { width: 0, height: 0 };
  const offsetX = normalizeNumber((offset as Record<string, any>)?.width, 0);
  const offsetY = normalizeNumber((offset as Record<string, any>)?.height, 0);

  if (typeof shadowColor === 'string') {
    if (shadowColor.startsWith('rgba')) {
      return `${offsetX}px ${offsetY}px ${shadowRadius}px ${shadowColor}`;
    }

    if (shadowColor.startsWith('rgb(')) {
      return `${offsetX}px ${offsetY}px ${shadowRadius}px ${shadowColor.replace('rgb', 'rgba').replace(')', `, ${shadowOpacity})`)}`;
    }

    if (shadowColor.startsWith('#')) {
      return `${offsetX}px ${offsetY}px ${shadowRadius}px ${hexToRgba(shadowColor, shadowOpacity)}`;
    }
  }

  return `${offsetX}px ${offsetY}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`;
};

export const createShadowStyle = ({ native, web }: ShadowConfig): ShadowStyle => {
  if (Platform.OS === 'web') {
    return { boxShadow: web ?? deriveWebShadow(native) };
  }

  return native as ShadowStyle;
};

let hasPatched = false;

export const applyWebShadowPatch = () => {
  if (hasPatched || Platform.OS !== 'web') {
    return;
  }

  hasPatched = true;

  const originalCreate = StyleSheet.create;

  StyleSheet.create = ((styles: Record<string, any>) => {
    const transformed: Record<string, any> = {};

    Object.keys(styles).forEach((key) => {
      const value = styles[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const hasShadow =
          'shadowColor' in (value as Record<string, any>) ||
          'shadowOpacity' in (value as Record<string, any>) ||
          'shadowRadius' in (value as Record<string, any>) ||
          'shadowOffset' in (value as Record<string, any>) ||
          'elevation' in (value as Record<string, any>);

        if (hasShadow) {
          const { boxShadow } = createShadowStyle({ native: value as ViewStyle });
          const { shadowColor, shadowOpacity, shadowRadius, shadowOffset, elevation, ...rest } =
            value as Record<string, any>;

          transformed[key] = {
            ...rest,
            ...(boxShadow ? { boxShadow } : {}),
          };
          return;
        }
      }

      transformed[key] = value;
    });

    return originalCreate(transformed);
  }) as typeof StyleSheet.create;
};

