import { Text } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

describe('Expo Router test harness', () => {
  it('can assert auth/onboarding route state from tests outside app routes', () => {
    const router = renderRouter(
      {
        index: () => <Text>Landing</Text>,
        'auth/index': () => <Text>Email OTP</Text>,
        'onboarding/profile/basic': () => <Text>Profile Basics</Text>,
      },
      { initialUrl: '/auth' },
    );

    expect(router.getPathname()).toBe('/auth');
    expect(screen.getByText('Email OTP')).toBeTruthy();
  });
});
