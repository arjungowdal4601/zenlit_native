import { getEmailOtpErrorMessage } from '../../src/utils/authEmail';

describe('auth email helpers', () => {
  it('maps returned OTP errors and thrown exceptions through one helper', () => {
    expect(getEmailOtpErrorMessage({ message: 'Too many requests' })).toBe(
      'Too many attempts. Please wait a few minutes before trying again.',
    );
    expect(getEmailOtpErrorMessage(new Error('Network request failed'))).toBe(
      'Unable to connect to authentication service. Please check your internet connection.',
    );
    expect(getEmailOtpErrorMessage(new Error('Email OTP request timed out'))).toBe(
      'The request took longer than expected. Check your inbox before requesting another code.',
    );
  });
});
