import type React from 'react';

const mockCreateIcon = (name: string) => {
  const MockIcon = () => {
    const ReactRuntime = require('react');
    const { Text } = require('react-native');
    return ReactRuntime.createElement(Text, { accessibilityElementsHidden: true }, name);
  };
  MockIcon.displayName = `MockIcon(${name})`;
  return MockIcon;
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(ReactRuntime.Fragment, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(async () => undefined),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { MAX: 'max' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 12.9716, longitude: 77.5946 },
  })),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-linear-gradient', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(View, props, children),
  };
});

jest.mock('@react-native-masked-view/masked-view', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(View, props, children),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: mockCreateIcon('Feather'),
  FontAwesome6: mockCreateIcon('FontAwesome6'),
}));

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}));

jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => null,
}));

jest.mock('lucide-react-native', () => ({
  Compass: mockCreateIcon('Compass'),
  MessageSquare: mockCreateIcon('MessageSquare'),
  Plus: mockCreateIcon('Plus'),
  UserCircle: mockCreateIcon('UserCircle'),
  Users: mockCreateIcon('Users'),
}));

jest.mock('../../src/lib/supabase', () => {
  const queryBuilder: Record<string, jest.Mock> = {};
  const createChannel = () => {
    const channel: Record<string, jest.Mock> = {};
    Object.assign(channel, {
      on: jest.fn(() => channel),
      subscribe: jest.fn(() => channel),
      track: jest.fn(async () => undefined),
      untrack: jest.fn(async () => undefined),
      send: jest.fn(async () => undefined),
      presenceState: jest.fn(() => ({})),
    });
    return channel;
  };

  Object.assign(queryBuilder, {
    select: jest.fn(() => queryBuilder),
    insert: jest.fn(() => queryBuilder),
    update: jest.fn(() => queryBuilder),
    delete: jest.fn(() => queryBuilder),
    upsert: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    neq: jest.fn(() => queryBuilder),
    gt: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lt: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    in: jest.fn(() => queryBuilder),
    not: jest.fn(() => queryBuilder),
    or: jest.fn(() => queryBuilder),
    order: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    single: jest.fn(async () => ({ data: null, error: null })),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
    then: jest.fn((resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
    ),
  });

  const supabase = {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      signInWithOtp: jest.fn(async () => ({ data: {}, error: null })),
      verifyOtp: jest.fn(async () => ({ data: { user: null }, error: null })),
      signOut: jest.fn(async () => ({ error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    realtime: {
      setAuth: jest.fn(async () => undefined),
    },
    from: jest.fn(() => queryBuilder),
    rpc: jest.fn(async () => ({ data: null, error: null })),
    channel: jest.fn(() => createChannel()),
    removeChannel: jest.fn(async () => 'ok'),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(async () => ({ data: null, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: '' }, error: null })),
        remove: jest.fn(async () => ({ data: null, error: null })),
      })),
    },
  };

  return {
    supabase,
    supabaseReady: true,
    supabaseConfigStatus: {
      ready: true,
      error: null,
      source: 'jest',
    },
    getSupabaseConfig: jest.fn(() => ({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
      source: 'jest',
    })),
    validateSupabaseConfig: jest.fn(() => ({
      ready: true,
      error: null,
      source: 'jest',
    })),
  };
});
