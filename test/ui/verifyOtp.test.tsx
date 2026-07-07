import { act, fireEvent, render, screen } from '../utils/render';

const mockReplace = jest.fn();
const mockVerifyEmailOtp = jest.fn();
const mockSignInWithEmailOtp = jest.fn();
let mockSearchParams: Record<string, unknown> = { email: 'alex@example.com' };

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    mockReplace(href);
    return null;
  },
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('../../src/services/authService', () => ({
  isAuthReady: () => true,
  signInWithEmailOtp: (...args: unknown[]) => mockSignInWithEmailOtp(...args),
  verifyEmailOtp: (...args: unknown[]) => mockVerifyEmailOtp(...args),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import VerifyOTPScreen from '../../app/auth/verify-otp';

describe('Verify OTP screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchParams = { email: 'alex@example.com' };
    mockReplace.mockClear();
    mockSignInWithEmailOtp.mockClear();
    mockVerifyEmailOtp.mockClear();
    mockSignInWithEmailOtp.mockResolvedValue({ error: null });
    mockVerifyEmailOtp.mockResolvedValue({
      user: { id: 'user-123', email: 'alex@example.com' },
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('verifies the code without choosing the post-auth route', async () => {
    render(<VerifyOTPScreen />);

    fireEvent.changeText(screen.getByLabelText('OTP code'), '123456');

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Verify & Continue' }));
      await Promise.resolve();
    });

    expect(mockVerifyEmailOtp).toHaveBeenCalledWith('alex@example.com', '123456');
    expect(screen.getByText('Code verified. Checking setup...')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalledWith('/onboarding/profile/basic');
    expect(mockReplace).not.toHaveBeenCalledWith('/onboarding/profile/complete');
    expect(mockReplace).not.toHaveBeenCalledWith('/radar');
  });

  it('redirects to auth instead of rendering without an email', () => {
    mockSearchParams = {};

    render(<VerifyOTPScreen />);

    expect(mockReplace).toHaveBeenCalledWith('/auth');
    expect(screen.queryByLabelText('OTP code')).toBeNull();
    expect(screen.queryByText('your email')).toBeNull();
    expect(mockVerifyEmailOtp).not.toHaveBeenCalled();
    expect(mockSignInWithEmailOtp).not.toHaveBeenCalled();
  });

  it('redirects to auth instead of rendering with an invalid email', () => {
    mockSearchParams = { email: 'bad-email' };

    render(<VerifyOTPScreen />);

    expect(mockReplace).toHaveBeenCalledWith('/auth');
    expect(screen.queryByLabelText('OTP code')).toBeNull();
    expect(mockVerifyEmailOtp).not.toHaveBeenCalled();
    expect(mockSignInWithEmailOtp).not.toHaveBeenCalled();
  });
});
